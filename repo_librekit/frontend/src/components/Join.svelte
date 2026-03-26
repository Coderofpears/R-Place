<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input";
	import { getConfig } from "$lib/utils/config";
	import API from "$lib/lkcore/api";
	import { LiveGame, OriginalLiveGame } from "$lib/lkcore/gamecore";
	import type { Room } from "blueboat-client";
	import ClassicUI from "./ClassicUI.svelte";
	import { toast } from "svelte-sonner";

	let gameCode = 0;
	let name = "librekit";
	let inGame = false;
	let gameStatus = "";
	let blueboatRoom: Room;

	function onKeyDown(e: KeyboardEvent) {
		if (e.ctrlKey || e.altKey || e.metaKey) return;

		// prevent non-numbers from being inputted
		if (e.key.length === 1 && isNaN(parseInt(e.key))) e.preventDefault();
	}

	async function join() {
		//const { LiveGame, OriginalLiveGame } = await import("$lib/lkcore/gamecore");

		const config = getConfig();
		const api = new API(config.apiBase);

		(window as any).api = api;

		const liveGame = new LiveGame(api, config.useStegCloak, gameCode, name);

		await liveGame.join();

		if (liveGame.source !== "original") {
			throw new Error(
				`Expected source original, got ${liveGame.source} (are you trying to join a 2D gamemode?)`
			);
		}

		const originalLiveGame = new OriginalLiveGame(liveGame, (room: Room) => {
			room.onMessage.add((action: string, data?: any) => {
				if (action === "STATE_UPDATE") {
					const key: string = data.type;
					const value: any = data.value;

					if (key === "GAME_STATUS") {
						gameStatus = value;
					}
				}

				console.log(action, data);
			});

			room.onJoinError.add((action: string, data?: any) => {
				console.error("Failed to join the game:", action, data);

				toast.error("Failed to join the game!", {
					description:
						action === "INVALID_INTENT"
							? "This is probably due to Gimkit changing something behind-the-scenes."
							: "We're not sure what happened. Check the browser console for more information."
				});
			});

			blueboatRoom = room;
		});

		(window as any).originalLiveGame = originalLiveGame;

		inGame = true;
	}
</script>

{#if inGame}
	{#if gameStatus == "gameplay"}
		<ClassicUI room={blueboatRoom} />
	{:else if gameStatus == "results"}
		<h1 class="mt-4 mb-4 text-5xl">Game over!</h1>
	{:else if gameStatus == "join"}
		<h1 class="mt-4 mb-4 text-2xl">Waiting for the game to start...</h1>
	{:else}
		<h1 class="mt-4 mb-4 text-2xl">Loading...</h1>
	{/if}
{:else}
	<h1 class="mt-4 mb-4 text-5xl">Join a game</h1>

	<p class="mb-2">Game code:</p>

	<Input
		type="number"
		bind:value={gameCode}
		on:keydown={onKeyDown}
		class="w-full sm:w-1/3 mb-4"
	/>

	<p class="mb-2">Name:</p>

	<Input bind:value={name} class="w-full sm:w-1/3 mb-4" />

	<Button on:click={join}>Join!</Button>
{/if}
