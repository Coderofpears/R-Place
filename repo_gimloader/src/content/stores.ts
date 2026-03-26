import { writable } from "svelte/store";

export const focusTrapEnabled = writable(true);
export const officialPluginsOpen = writable(false);
export const gameState = { inGame: false };
