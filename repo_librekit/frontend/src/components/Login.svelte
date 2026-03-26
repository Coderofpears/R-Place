<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input";
	import { getConfig } from "$lib/utils/config";
	import API from "$lib/lkcore/api";
	import { LiveGame, OriginalLiveGame } from "$lib/lkcore/gamecore";

	let email = "";
	let password = "";

	async function login() {
		const config = getConfig();
		const api = new API(config.apiBase);

		(window as any).api = api;

		const response = await api.post("/api/login", {
			email,
			googleToken: "",
			password
		});

		if (
			typeof response.message === "object" &&
			typeof response.message.text === "string"
		) {
			// We know something went wrong.
			throw new Error(response.message.text);
		}

		// We're now logged in! Yay!
		location.href = "/kits";
	}
</script>

<h1 class="mt-4 mb-4 text-5xl">Log in</h1>

<p class="mb-2">Email:</p>

<Input type="email" bind:value={email} class="w-full sm:w-1/3 mb-4" />

<p class="mb-2">Password:</p>

<Input type="password" bind:value={password} class="w-full sm:w-1/3 mb-4" />

<Button on:click={login}>Submit</Button>
