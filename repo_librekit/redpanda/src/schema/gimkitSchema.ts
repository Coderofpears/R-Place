import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";
import { HOOK_JSON, MAP_SETTINGS } from "../constants";

export class Hooks extends Schema {
	@type("string") hookJSON: string = HOOK_JSON;
}

export class Matchmaker extends Schema {
	@type("string") gameCode: string;
}

export class Physics extends Schema {
	@type("boolean") isGrounded: boolean = true;
}

export class ZoneAbilitiesOverrides extends Schema {
	@type("boolean") allowWeaponFire: boolean = true;
	@type("boolean") allowWeaponDrop: boolean = true;
	@type("boolean") allowItemDrop: boolean = true;
	@type("boolean") allowResourceDrop: boolean = true;
}

export class Projectiles extends Schema {
	@type("number") aimAngle: number = 0;
	@type("number") damageMultiplier: number = 1;
}

export class Health extends Schema {
	@type("number") fragility: number = 0;
	@type("number") health: number = 50;
	@type("number") shield: number = 50;
	@type("number") maxHealth: number = 50;
	@type("number") maxShield: number = 50;
	@type("boolean") spawnImmunityActive: boolean = false;
	@type("boolean") classImmunityActive: boolean = false;
}

export class Assignment extends Schema {
	@type("number") percentageComplete: number;
	@type("string") objective: string;
	@type("boolean") hasSavedProgress: boolean = false;
}

export class Xp extends Schema {
	@type("number") unredeemedXP: number = 0;
}

export class InteractiveSlotsItem extends Schema {
	@type("string") itemId: string;
	@type("boolean") waiting: boolean;
	@type("number") waitingStartTime: number;
	@type("number") waitingEndTime: number;
	@type("number") currentClip: number;
	@type("number") clipSize: number;
	@type("number") durability: number;
	@type("number") count: number;
}

export class SlotsItem extends Schema {
	@type("number") amount: number;
}

export class Inventory extends Schema {
	@type("number") maxSlots: number = 999;
	@type("number") activeInteractiveSlot: number = 0;
	@type({ map: InteractiveSlotsItem }) interactiveSlots =
		new MapSchema<InteractiveSlotsItem>();
	@type(["number"]) interactiveSlotsOrder = new ArraySchema<number>(
		1,
		2,
		3,
		4,
		5
	);
	@type("boolean") infiniteAmmo: boolean = true;
	@type({ map: SlotsItem }) slots = new MapSchema<SlotsItem>();
}

export class Permissions extends Schema {
	@type("boolean") adding: boolean = true;
	@type("boolean") removing: boolean = true;
	@type("boolean") editing: boolean = true;
	@type("boolean") manageCodeGrids: boolean = true;
}

export class Appearance extends Schema {
	@type("string") skinId: string = '{"id":"character_default_gray"}';
	@type("string") trailId: string = "";
	@type("string") transparencyModifierId: string = "";
	@type("string") tintModifierId: string = "";
}

export class CharactersItem extends Schema {
	@type("string") id: string;
	@type("string") teamId: string = "__NO_TEAM_ID";
	@type("string") name: string;
	@type("string") type: string = "player";
	@type("boolean") isActive: boolean = true;
	@type("number") roleLevel: number = 50;
	@type("number") x: number;
	@type("number") y: number;
	@type("number") teleportCount: number = 2;
	@type("number") movementSpeed: number = 310;
	@type("boolean") phase: boolean = false;
	@type("string") openDeviceUI: string = "";
	@type("number") openDeviceUIChangeCounter: number = 0;
	@type("boolean") completedInitialPlacement: boolean = false;
	@type("boolean") isRespawning: boolean = false;
	@type("number") score: number = 0;
	@type("string") activeClassDeviceId: string = "";
	@type(Appearance) appearance: Appearance = new Appearance();
	@type(Permissions) permissions: Permissions = new Permissions();
	@type(Inventory) inventory: Inventory = new Inventory();
	@type(Xp) xp: Xp = new Xp();
	@type(Assignment) assignment: Assignment = new Assignment();
	@type(Health) health: Health = new Health();
	@type(Projectiles) projectiles: Projectiles = new Projectiles();
	@type(ZoneAbilitiesOverrides) zoneAbilitiesOverrides: ZoneAbilitiesOverrides =
		new ZoneAbilitiesOverrides();
	@type(Physics) physics: Physics = new Physics();

	constructor(config: { id: string; name: string; x: number; y: number }) {
		super();
		this.id = config.id;
		this.name = config.name;
		this.x = config.x;
		this.y = config.y;
	}
}

export class CodeGridItem extends Schema {
	@type("number") createdAt: number;
	@type("string") json: string;
	@type("string") owner: string;
	@type("string") triggerType: string;
	@type("string") triggerValue: string;
	@type("number") updatedAt: number;
	@type(["string"]) visitors = new ArraySchema<string>();
}

export class CodeGrids extends Schema {
	@type({ map: CodeGridItem }) items = new MapSchema<CodeGridItem>();
}

export class Devices extends Schema {
	@type({ map: CodeGrids }) codeGrids = new MapSchema<CodeGrids>();
}

export class World extends Schema {
	@type("number") width: number = 1000;
	@type("number") height: number = 1000;
	@type(Devices) devices: Devices = new Devices();
}

export class TeamsItem extends Schema {
	@type("string") id: string;
	@type("string") name: string;
	@type("number") score: number;
	@type(["string"]) characters = new ArraySchema<string>();
}

export class GlobalPermissions extends Schema {
	@type("boolean") adding: boolean = false;
	@type("boolean") removing: boolean = false;
	@type("boolean") editing: boolean = false;
	@type("boolean") manageCodeGrids: boolean = false;
}

export class CategoriesItem extends Schema {
	@type("string") id: string;
	@type("string") name: string;
	@type("string") pluralName: string;
}

export class ItemsItem extends Schema {
	@type("string") id: string;
}

export class CallToAction extends Schema {
	@type([CategoriesItem]) categories = new ArraySchema<CategoriesItem>();
	@type([ItemsItem]) items = new ArraySchema<ItemsItem>();
}

export class GameSession extends Schema {
	@type("string") phase: string = "countdown";
	@type("number") countdownEnd: number = 0;
	@type("number") resultsEnd: number = 0;
	@type(CallToAction) callToAction: CallToAction = new CallToAction();
}

export class Session extends Schema {
	@type("string") version: string = "published";
	@type("string") modeType: string = "liveGame";
	@type("string") gameOwnerId: string;
	@type("number") gameTime: number = Date.now();
	@type("string") phase: string = "preGame";
	@type("boolean") loadingPhase: boolean = false;
	@type(GameSession) gameSession: GameSession = new GameSession();
	@type(GlobalPermissions) globalPermissions: GlobalPermissions =
		new GlobalPermissions();
	@type("number") mapCreatorRoleLevel: number = 90;
	@type("boolean") cosmosBlocked: boolean = false;
	@type("string") mapStyle: string;

	constructor(config: { mapStyle: string }) {
		super();
		this.mapStyle = config.mapStyle;
	}
}

export class GimkitState extends Schema {
	@type(Session) session: Session;
	@type([TeamsItem]) teams = new ArraySchema<TeamsItem>();
	@type(World) world: World = new World();
	@type({ map: CharactersItem }) characters = new MapSchema<CharactersItem>();
	@type("string") mapSettings: string = MAP_SETTINGS;
	@type(Matchmaker) matchmaker: Matchmaker = new Matchmaker();
	@type(Hooks) hooks: Hooks = new Hooks();

	constructor(config: { mapStyle: string }) {
		super();
		this.session = new Session({ mapStyle: config.mapStyle });
	}
}
