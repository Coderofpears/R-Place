import { Client, Room } from "colyseus";
import Matchmaker, { Game } from "../net/matchmaker";
import { CodeGridsDevice, CodeGridsGrid, GimkitState } from "./schema";
import DeviceManager from "./deviceManager";
import TileManager from "./tileManager";
import Player from "../objects/player/player";
import PhysicsManager from "./physics";
import RAPIER from "@dimforge/rapier2d-compat";
import TeamManager from "./teamManager";
import EventEmitter from "node:events";
import PluginManager from "../plugins";
import { join } from "node:path";
import { dataPath } from "../consts";
import type { CodeGrid, DeviceInfo, MapInfo, Wire } from "$types/map";
import { MapOptionsOptions } from "$types/devices";
import ProjectileManager from "./projectiles";
import fsp from "node:fs/promises";

interface RoomOptions {
    intentId: string;
    authToken: string; // not currently used
}

interface ClientOptions {
    intentId: string;
}

type MsgCallback = (player: Player, message: any) => void;

export class GameRoom extends Room<GimkitState> {
    game: Game;
    map: MapInfo;
    physics: PhysicsManager;
    world: RAPIER.World;
    devices: DeviceManager;
    mapSettings: MapOptionsOptions;
    terrain: TileManager;
    updateTimeInterval: Timer;
    teams: TeamManager;
    projectiles: ProjectileManager;
    players: Player[] = [];
    host: Player;
    gameStarted: number = 0;
    messageEvents = new EventEmitter();
    startCallbacks = new Set<() => void>();
    restoreCallbacks = new Set<() => void>();
    creativeCooldowns = new Map<string, number>();
    worldSaveTimer: Timer | null = null;

    onMsg(type: string, callback: MsgCallback) { this.messageEvents.on(type, callback); }
    offMsg(type: string, callback: MsgCallback) { this.messageEvents.off(type, callback); }
    onStart(callback: () => void) { this.startCallbacks.add(callback); }
    offStart(callback: () => void) { this.startCallbacks.delete(callback); }
    onRestore(callback: () => void) { this.restoreCallbacks.add(callback); }
    offRestore(callback: () => void) { this.restoreCallbacks.delete(callback); }

    parseJSON<T>(value: T | string | undefined, fallback: T): T {
        if(value === undefined) return fallback;
        if(typeof value !== "string") return value;

        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }

    ensureCodeGridDevice(deviceId: string) {
        if(!this.map.codeGrids[deviceId]) {
            this.map.codeGrids[deviceId] = {};
        }

        if(!this.state.world.devices.codeGrids.has(deviceId)) {
            this.state.world.devices.codeGrids.set(deviceId, new CodeGridsDevice({}));
        }
    }

    syncDeviceCodeGrids(deviceId: string) {
        const device = this.devices.getById(deviceId);
        if(device) {
            device.codeGrids = Object.values(this.map.codeGrids[deviceId] ?? {});
        }
    }

    createWireInfo(info: Partial<Wire> & Pick<Wire, "startDevice" | "endDevice">): Wire {
        return {
            id: info.id ?? `${info.startDevice}-${info.endDevice}`,
            startDevice: info.startDevice,
            endDevice: info.endDevice,
            startConnection: info.startConnection ?? "",
            endConnection: info.endConnection ?? ""
        };
    }

    addWireInternal(info: Partial<Wire> & Pick<Wire, "startDevice" | "endDevice">) {
        const wire = this.createWireInfo(info);
        if(this.map.wires.find((existing) => existing.id === wire.id)) return null;

        this.map.wires.push(wire);

        const startDevice = this.devices.getById(wire.startDevice);
        startDevice?.wires.push(wire);

        this.devices.broadcastWireChanges([wire], []);
        return wire;
    }

    removeWireInternal(id: string) {
        const index = this.map.wires.findIndex((wire) => wire.id === id);
        if(index === -1) return null;

        const [wire] = this.map.wires.splice(index, 1);
        const startDevice = this.devices.getById(wire.startDevice);
        if(startDevice) {
            startDevice.wires = startDevice.wires.filter((existing) => existing.id !== id);
        }

        this.devices.broadcastWireChanges([], [id]);
        return wire;
    }

    clearPlayerCodeGridPresence(playerId: string) {
        this.state.world.devices.codeGrids.forEach((device) => {
            device.items.forEach((grid) => {
                if(grid.owner === playerId) {
                    grid.owner = "";
                }

                for(let i = grid.visitors.length - 1; i >= 0; i--) {
                    if(grid.visitors[i] === playerId) {
                        grid.visitors.splice(i, 1);
                    }
                }
            });
        });
    }
    
    async onCreate(options: RoomOptions) {
        this.autoDispose = false;
        this.maxClients = Infinity;
        this.game = Matchmaker.getByHostIntent(options.intentId) ?? Matchmaker.activeGame;

        if(this.game) {
            this.game.colyseusRoomId = this.roomId;
            this.map = this.game.map;
            this.physics = new PhysicsManager(this);
            this.world = this.physics.world;
            this.devices = new DeviceManager(this.map, this);
            this.mapSettings = this.devices.getMapSettings();
            this.terrain = new TileManager(this.map, this);
            this.teams = new TeamManager(this);
            this.projectiles = new ProjectileManager(this);

            this.setState(new GimkitState({
                gameCode: this.game.code,
                ownerId: options.intentId,
                map: this.map,
                mapSettings: this.mapSettings
            }));

            this.state.session.globalPermissions.adding = true;
            this.state.session.globalPermissions.removing = true;
            this.state.session.globalPermissions.editing = true;
            this.state.session.globalPermissions.manageCodeGrids = true;
            this.state.session.version = "saved";

            PluginManager.trigger("onRoom", this.game.mapId, this);
            this.scheduleWorldSave();
        } else {
            this.disconnect();
            return;
        }

        this.onMsg("REQUEST_INITIAL_WORLD", (player) => {
            player.client.send("DEVICES_STATES_CHANGES", this.devices.getInitialChanges());
            player.client.send("TERRAIN_CHANGES", this.terrain.getInitialMessage());
            player.client.send("WORLD_CHANGES", this.devices.getInitialWorld());
            player.syncPhysics(true);
        });

        this.onMsg("START_GAME", (player) => {
            if(!player.isHost) return;
            if(this.state.session.phase !== "preGame") return;

            this.state.session.phase = "game";
            this.state.session.gameSession.phase = "game";
            this.gameStarted = Date.now() + 1200;
            this.showLoading(1200, () => {
                for(let cb of this.startCallbacks) cb();
            });
        });

        this.onMsg("END_GAME", (player) => {
            if(!player.isHost) return;
            if(this.state.session.phase !== "game") return;

            this.state.session.gameSession.phase = "results";
        });

        this.onMsg("RESTORE_MAP_EARLIER", (player) => {
            if(!player.isHost) return;
            if(this.state.session.phase !== "game" || this.state.session.gameSession.phase !== "results") return;

            this.state.session.phase = "preGame";
            this.showLoading(1200, () => {
                this.broadcast("RESET");
                for(let cb of this.restoreCallbacks) cb();
            });
        });

        this.onMsg("PLACE_TERRAIN", (player, message: { x: number, y: number, terrain: string, collides: boolean, depth: number }) => {
            this.terrain.placeTile(message.x, message.y, message.terrain, !!message.collides, message.depth, player);
        });

        this.onMsg("REMOVE_TERRAIN", (player, message: { x: number, y: number, depth: number }) => {
            this.terrain.removeTile(message.x, message.y, message.depth, player);
        });

        this.onMsg("PLACE_DEVICE", (player, message: {
            id: string;
            deviceTypeId: string;
            options: string | Record<string, any>;
            x: number;
            y: number;
            depth: number;
            layerId: string;
            copyingFromExistingDevice?: string;
        }) => {
            const info: DeviceInfo<any> = {
                id: message.id,
                x: Math.round(message.x),
                y: Math.round(message.y),
                depth: message.depth,
                layer: message.layerId,
                deviceId: message.deviceTypeId as any,
                options: this.parseJSON(message.options, {})
            };

            const device = this.devices.createDevice(info, false, player);
            if(!device) return;

            this.map.devices.push(info);
            this.ensureCodeGridDevice(info.id);

            if(message.copyingFromExistingDevice && this.map.codeGrids[message.copyingFromExistingDevice]) {
                const copiedGrids = Object.fromEntries(
                    Object.entries(this.map.codeGrids[message.copyingFromExistingDevice]).map(([gridId, grid]) => [
                        gridId,
                        structuredClone(grid)
                    ])
                ) as Record<string, CodeGrid>;

                this.map.codeGrids[info.id] = copiedGrids;
                this.state.world.devices.codeGrids.set(info.id, new CodeGridsDevice(copiedGrids));
                this.syncDeviceCodeGrids(info.id);
            }
        });

        this.onMsg("REMOVE_DEVICE", (player, message: { id: string }) => {
            if(!this.canCreativeEdit(player, "delete map changes")) return;

            const device = this.devices.getById(message.id);
            if(!device) return;
            if(!this.devices.removeDevice(device)) return;

            this.map.devices = this.map.devices.filter((info) => info.id !== message.id);

            const wireIds = this.map.wires
                .filter((wire) => wire.startDevice === message.id || wire.endDevice === message.id)
                .map((wire) => wire.id);

            for(let wireId of wireIds) {
                this.removeWireInternal(wireId);
            }

            delete this.map.codeGrids[message.id];
            this.state.world.devices.codeGrids.delete(message.id);
            this.scheduleWorldSave();
        });

        this.onMsg("PLACE_WIRE", (player, message: Partial<Wire> & Pick<Wire, "startDevice" | "endDevice">) => {
            if(!this.canCreativeEdit(player, "place or edit the map")) return;
            this.addWireInternal(message);
        });

        this.onMsg("REMOVE_WIRE", (player, message: { id: string }) => {
            if(!this.canCreativeEdit(player, "delete map changes")) return;
            this.removeWireInternal(message.id);
        });

        this.onMsg("CREATE_CODE_GRID", (player, message: { deviceId: string, triggerType: string, triggerValue?: string }) => {
            this.ensureCodeGridDevice(message.deviceId);

            const gridId = crypto.randomUUID();
            const now = Date.now();
            const grid: CodeGrid & { owner: string, visitors: string[] } = {
                triggerType: message.triggerType,
                triggerValue: message.triggerValue ?? "",
                json: { blocks: { blocks: [] } },
                owner: "",
                visitors: [],
                createdAt: now,
                updatedAt: now
            };

            this.map.codeGrids[message.deviceId][gridId] = grid;
            this.state.world.devices.codeGrids.get(message.deviceId)?.items.set(gridId, new CodeGridsGrid(grid));
            this.syncDeviceCodeGrids(message.deviceId);
            this.scheduleWorldSave();
        });

        this.onMsg("SET_CODE_GRID_JSON", (player, message: { deviceId: string, gridId: string, json: string }) => {
            const grid = this.map.codeGrids[message.deviceId]?.[message.gridId];
            const stateGrid = this.state.world.devices.codeGrids.get(message.deviceId)?.items.get(message.gridId);
            if(!grid || !stateGrid) return;

            grid.json = this.parseJSON(message.json, { blocks: { blocks: [] } });
            grid.updatedAt = Date.now();
            stateGrid.json = message.json;
            stateGrid.updatedAt = grid.updatedAt;
            this.scheduleWorldSave();
        });

        this.onMsg("JOIN_CODE_GRID", (player, message: { deviceId: string, gridId: string }) => {
            const grid = this.state.world.devices.codeGrids.get(message.deviceId)?.items.get(message.gridId);
            if(!grid) return;

            if(!grid.owner) {
                grid.owner = player.id;
            } else if(grid.owner !== player.id && !grid.visitors.includes(player.id)) {
                grid.visitors.push(player.id);
            }
        });

        this.onMsg("LEAVE_CODE_GRID", (player, message: { deviceId: string, gridId: string }) => {
            const grid = this.state.world.devices.codeGrids.get(message.deviceId)?.items.get(message.gridId);
            if(!grid) return;

            if(grid.owner === player.id) {
                grid.owner = "";
            }

            for(let i = grid.visitors.length - 1; i >= 0; i--) {
                if(grid.visitors[i] === player.id) {
                    grid.visitors.splice(i, 1);
                }
            }
        });

        this.onMsg("DELETE_CODE_GRID", (player, message: { deviceId: string, gridId: string }) => {
            if(!this.map.codeGrids[message.deviceId]?.[message.gridId]) return;

            delete this.map.codeGrids[message.deviceId][message.gridId];
            this.state.world.devices.codeGrids.get(message.deviceId)?.items.delete(message.gridId);
            this.syncDeviceCodeGrids(message.deviceId);
            this.scheduleWorldSave();
        });
        
        this.onMessage("*", (client, type: string, message) => {
            let player = this.players.find((p) => p.client === client);
            if(!player) return;
            
            this.messageEvents.emit(type, player, message);
            player.messageEvents.emit(type, message);
        });

        this.updateTimeInterval = setInterval(() => {
			this.state.session.gameTime = Date.now();
		}, 500);
    }

    onDispose() {
        clearInterval(this.updateTimeInterval);
        this.physics.dispose();
        if(this.worldSaveTimer) clearTimeout(this.worldSaveTimer);
        if(this.game && Matchmaker.activeGame?.roomId === this.game.roomId) {
            Matchmaker.games = [];
            Matchmaker.activeGame = null;
        }
    }

    async onJoin(client: Client, options: ClientOptions) {
        let intent = this.game.clientIntents.get(options?.intentId);
        if(!intent) {
            client.leave();
            return;
        }
        
        let name = intent.name;
        this.game.clientIntents.delete(options.intentId);
        client.userData = { id: options.intentId };

        // create the player object
        await this.devices.devicesLoaded;

        let player = new Player(this, client, options.intentId, name, intent.cosmetics);

        // if the intentId is that of the game they are the host
        if(options.intentId === this.game.intentId) {
            this.host = player;
            player.isHost = true;
        }
        this.players.push(player);

        this.devices.onJoin(player);
    }

    onLeave(client: Client, consented: boolean) {
        const kickPlayer = () => {
            let index = this.players.findIndex((p) => p.client === client);
            if(index === -1) return;
            let player = this.players[index];

            this.clearPlayerCodeGridPresence(player.id);
            player.leaveGame();
            this.teams.onLeave(player);
            this.players.splice(index, 1);
        }

        if(consented) {
            kickPlayer();
        } else {
            this.allowReconnection(client, 30).catch(kickPlayer);
        }
    }

    // as far as I can tell the loading screens are purely to mask teleports
    showLoading(duration: number, halfCallback?: () => void) {
        this.state.session.loadingPhase = true;

        if(halfCallback) {
            setTimeout(halfCallback, duration / 2);
        }

        setTimeout(() => {
            this.state.session.loadingPhase = false;
        }, duration);
    }

    canCreativeEdit(player: Player, action: string) {
        const last = this.creativeCooldowns.get(player.id) ?? 0;
        const cooldownMs = 5 * 60 * 1000;
        const now = Date.now();
        if(now - last < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - (now - last)) / 1000);
            player.client.send("ACTIVITY_FEED_MESSAGE", {
                id: crypto.randomUUID(),
                message: `Error: ${player.name}, you can only ${action} once every 5 minutes. Try again in ${remaining}s.`
            });
            return false;
        }

        this.creativeCooldowns.set(player.id, now);
        return true;
    }

    scheduleWorldSave() {
        if(this.worldSaveTimer) clearTimeout(this.worldSaveTimer);
        this.worldSaveTimer = setTimeout(() => {
            this.worldSaveTimer = null;
            this.saveWorldSnapshot().catch(() => {});
        }, 250);
    }

    async saveWorldSnapshot() {
        if(!this.game) return;

        const world = {
            mapStyle: this.map.mapStyle,
            codeGrids: this.map.codeGrids,
            devices: this.devices.devices.map((device) => ({
                id: device.id,
                x: device.x,
                y: device.y,
                depth: device.depth,
                layer: device.layer,
                deviceId: device.deviceId,
                options: device.options,
                globalState: device.globalState,
                teamStates: device.teamStates,
                playerStates: device.playerStates,
                codeGrids: Object.fromEntries(
                    device.codeGrids.map((grid) => {
                        const key = `${grid.triggerType}:${grid.triggerValue ?? ""}:${grid.createdAt}`;
                        return [key, grid];
                    })
                )
            })),
            tiles: Object.fromEntries(Object.entries(this.terrain.tiles).map(([coords, tile]) => [
                coords,
                {
                    terrain: tile.terrain,
                    depth: tile.depth,
                    collides: tile.collides
                }
            ])),
            wires: this.map.wires,
            meta: this.map.meta,
            requiredPlugins: this.map.requiredPlugins
        };

        const snapshot = {
            roomId: this.roomId,
            gameCode: this.game.code,
            savedAt: new Date().toISOString(),
            world
        };

        await fsp.writeFile(join(dataPath, "map.json"), JSON.stringify(world, null, 2));
        await fsp.writeFile(join(dataPath, "worlds.json"), JSON.stringify({ worlds: [snapshot] }, null, 2));
    }
}
