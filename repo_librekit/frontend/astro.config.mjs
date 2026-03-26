import { defineConfig } from "astro/config";

import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://astro.build/config
export default defineConfig({
	integrations: [
		svelte(),
		tailwind({
			applyBaseStyles: false
		})
	],
	vite: {
		plugins: [nodePolyfills()]
	}
});
