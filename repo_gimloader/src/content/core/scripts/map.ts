import type { Script } from "./script.svelte";

// Scripts must have globally unique name
export const scripts = new Map<string, Script>();
