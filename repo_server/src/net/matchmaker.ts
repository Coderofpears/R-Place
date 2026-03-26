import { defaultCosmetics } from '../consts';
import express from './express';
import { generateGameCode } from '../utils';
import MapData from './mapData';
import config from "$config";
import { matchMaker } from "@colyseus/core";
import type { Cosmetics } from '$types/schema';
import type { MapInfo } from "$types/map";
import { dataPath, mapsPath } from "../consts";
import { join } from "node:path";

interface ClientIntent {
    name: string;
    cosmetics: Cosmetics;
}

export interface Game {
    intentId: string;
    clientIntents: Map<string, ClientIntent>;
    roomId: string;
    colyseusRoomId?: string;
    mapId: string;
    code: string;
    map: MapInfo;
}

export default class Matchmaker {
    static games: Game[] = [];
    static serverUrl = `${config.address}:${config.visibleGamePort}`;
    static activeGame: Game | null = null;
    static hostingPromise: Promise<Game> | null = null;

    static getCookie(req: any, key: string) {
        const cookie = req.headers?.cookie ?? req.headers?.get?.("cookie") ?? "";
        const match = cookie.split(";").map((part: string) => part.trim()).find((part: string) => part.startsWith(`${key}=`));
        return match ? decodeURIComponent(match.slice(key.length + 1)) : null;
    }

    static async getCreativeMap(): Promise<{ mapId: string; map: MapInfo; }> {
        const persistedMapPath = join(dataPath, "map.json");
        try {
            const json = await Bun.file(persistedMapPath).json() as MapInfo;
            return { mapId: "creative", map: json };
        } catch {
            // fall back to a bundled starter map
        }

        const firstMap = MapData.maps[0];
        if(!firstMap) {
            throw new Error("No maps available");
        }

        const map = await Bun.file(join(mapsPath, firstMap.file)).json() as MapInfo;
        return { mapId: firstMap.mapId, map };
    }

    static async ensureGame(name = "Host", cosmetics: Cosmetics = defaultCosmetics) {
        if(this.activeGame?.colyseusRoomId && !this.isRoomAlive(this.activeGame.colyseusRoomId)) {
            this.games = [];
            this.activeGame = null;
        }

        if(this.activeGame) return this.activeGame;

        const creative = await this.getCreativeMap();
        const game: Game = {
            intentId: crypto.randomUUID(),
            roomId: crypto.randomUUID(),
            clientIntents: new Map(),
            mapId: creative.mapId,
            code: generateGameCode(),
            map: creative.map
        };

        game.clientIntents.set(game.intentId, { name, cosmetics });
        this.games = [game];
        this.activeGame = game;
        await this.ensureHostedGame(game);
        return game;
    }

    static async ensureHostedGame(game: Game) {
        if(game.colyseusRoomId && this.isRoomAlive(game.colyseusRoomId)) return game;
        if(this.hostingPromise) return this.hostingPromise;

        this.hostingPromise = (async () => {
            const room = await matchMaker.createRoom("MapRoom", {
                intentId: game.intentId
            });

            game.colyseusRoomId = room.roomId;
            return game;
        })().finally(() => {
            this.hostingPromise = null;
        });

        return this.hostingPromise;
    }

    static isRoomAlive(roomId: string) {
        return !!matchMaker.getRoomById(roomId);
    }

    static createGame(mapId: string, name = "Host", cosmetics: Cosmetics = defaultCosmetics, map?: MapInfo) {
        const existing = this.activeGame;
        if(existing) return existing;

        const game: Game = {
            intentId: crypto.randomUUID(),
            roomId: crypto.randomUUID(),
            clientIntents: new Map(),
            mapId,
            code: generateGameCode(),
            map: map ?? ({} as MapInfo)
        };

        game.clientIntents.set(game.intentId, { name, cosmetics });
        this.games = [game];
        this.activeGame = game;
        return game;
    }

    static getByHostIntent(intentId: string) {
        let game = this.games.find(g => g.intentId === intentId);
        return game;
    }
    
    static getByCode(code: string) {
        let game = this.activeGame ?? this.games.find(g => g.code === code);
        return game;
    }

    static getByRoomId(roomId: string) {
        let game = this.activeGame ?? this.games.find(g => g.roomId === roomId);
        return game;
    }

    static init() {
        // creating games
        express.post("/api/matchmaker/intent/map/play/create", async (req, res) => {
            const name = req.body.name ?? this.getCookie(req, "gkc_name") ?? "Host";
            let cosmetics = req.body.cosmetics ?? defaultCosmetics;
            let game = await this.ensureGame(name, cosmetics);
            game.clientIntents.set(game.intentId, { name, cosmetics });

            console.log("Room created with code", game.code);
            res.send(`${game.intentId}&custom=true`);
        });

        express.get("/api/matchmaker/intent/fetch-source/:id", (req, res) => {
            res.send("map");
        });

        express.get("/api/matchmaker/intent/map/summary/:id", (req, res) => {
            let game = this.getByHostIntent(req.params.id);
            if(game) res.json({ mapId: game.mapId });
            else res.status(404).send();
        });

        express.post("/api/matchmaker/find-server-to-host-game", (req, res) => {
            res.json({ url: this.serverUrl });
        });

        express.get("/api/random-room", async (req, res) => {
            const name = this.getCookie(req, "gkc_name") ?? "Visitor";
            const cosmetics = defaultCosmetics;

            const hostedGames = this.games.filter(game => game.colyseusRoomId);
            const game = this.activeGame ?? hostedGames[0] ?? this.games[0];

            if(game) {
                if(game.colyseusRoomId) {
                    const intentId = crypto.randomUUID();
                    game.clientIntents.set(intentId, {
                        name,
                        cosmetics
                    });

                    res.json({
                        joinDetails: {
                            roomId: game.colyseusRoomId,
                            intentId,
                            serverUrl: this.serverUrl
                        }
                    });
                    return;
                }

                res.json({
                    createDetails: {
                        intentId: game.intentId
                    }
                });
                return;
            }

            const maps = MapData.maps;
            if(maps.length === 0) {
                res.status(404).json({ message: "No maps available" });
                return;
            }

            const createdGame = await this.ensureGame(name, cosmetics);
            res.json({
                createDetails: {
                    intentId: createdGame.intentId
                }
            });
        });

        // joining games
        express.post("/api/matchmaker/find-info-from-code", async (req, res) => {
            let game = this.getByCode(req.body.code) ?? this.activeGame ?? await this.ensureGame(
                this.getCookie(req, "gkc_name") ?? "Visitor",
                defaultCosmetics
            );

            res.json({ roomId: game.roomId, useRandomNamePicker: false });
        });

        express.post("/api/matchmaker/join", async (req, res) => {
            let room = this.getByRoomId(req.body.roomId) ?? this.activeGame ?? await this.ensureGame(
                req.body.name ?? this.getCookie(req, "gkc_name") ?? "Visitor",
                req.body.cosmetics ?? defaultCosmetics
            );

            await this.ensureHostedGame(room);

            let intentId = crypto.randomUUID();

            let name = req.body.name ?? this.getCookie(req, "gkc_name") ?? "Visitor";
            let cosmetics = req.body.cosmetics ?? defaultCosmetics;
            room.clientIntents.set(intentId, { name, cosmetics });

            res.json({
                source: "map",
                serverUrl: this.serverUrl,
                roomId: room.colyseusRoomId,
                intentId
            });
        });
    }
}
