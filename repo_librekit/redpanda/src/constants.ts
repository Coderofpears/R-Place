import fs from "fs";

export const MATCHMAKER_PORT = 7857;
export const GAME_SERVER_PORT = 7859;
export const GAME_SERVER_URL = `http://localhost:${GAME_SERVER_PORT}`;
export const MAP_SETTINGS = fs.readFileSync("assets/map_settings.json", "utf8");
export const HOOK_JSON = fs.readFileSync("assets/hooks.json", "utf8");
