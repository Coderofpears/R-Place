<script lang="ts">
	import * as Carousel from "$lib/components/ui/carousel";
	import * as Card from "$lib/components/ui/card";
	import * as Tabs from "$lib/components/ui/tabs";
	import gamemodes from "$lib/static/gamemodes";
	import PlayCircle from "svelte-material-icons/PlayCircleOutline.svelte";
	import type { IGamemode, IKit } from "$lib/types";
	import Number from "./optionInputs/Number.svelte";
	import Toggle from "./optionInputs/Toggle.svelte";
	import Button from "./ui/button/button.svelte";

	export let kit: Partial<IKit>;
	kit;

	let openTab = "gamemode";
	let selected = gamemodes[0];

	function selectGamemode(gamemode: IGamemode) {
		selected = gamemode;
	}

	function confirmGamemode() {
		openTab = "settings";
	}
</script>

<Tabs.Root bind:value={openTab} class="w-2/3">
	<Tabs.List class="grid w-full grid-cols-2">
		<Tabs.Trigger value="gamemode">Gamemode</Tabs.Trigger>
		<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="gamemode">
		<div class="flex flex-col items-center p-3 gap-3">
			<h1 class="text-6xl mb-8">Select gamemode</h1>
			<Carousel.Root class="w-full" opts={{ loop: true }}>
				<Carousel.Content>
					{#each gamemodes as gamemode}
						<Carousel.Item class="basis-1/4">
							<Card.Root>
								<Card.Content
									class="p-0 bg-primary-foreground rounded-lg border-2 {selected ===
									gamemode
										? 'border-selected'
										: ''}"
								>
									<button
										class="h-32 w-full flex flex-col"
										on:click={() => selectGamemode(gamemode)}
										on:dblclick={confirmGamemode}
									>
										<div class="flex-grow w-full text-center text-7xl mt-2">
											{gamemode.emoji}
										</div>
										<div
											class="text-2xl w-full text-center border-t-2 font-semibold"
										>
											{gamemode.name}
										</div>
									</button>
								</Card.Content>
							</Card.Root>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				<Carousel.Previous />
				<Carousel.Next />
			</Carousel.Root>
			<div class="flex items-center mt-16">
				<div class="text-9xl">
					{selected.emoji}&nbsp;
				</div>
				<div>
					<div class="text-5xl font-semibold border-b-2">
						{selected.name}
					</div>
					<div class="text-xl">
						{selected.description}
					</div>
				</div>
				<button
					class="ml-3 hover:scale-105 transition-transform"
					on:click={confirmGamemode}
				>
					<PlayCircle width={100} height={100} />
				</button>
			</div>
		</div>
	</Tabs.Content>
	<Tabs.Content value="settings">
		<div class="flex flex-col items-center">
			<h1 class="text-4xl mt-8 mb-4">Gamemode settings</h1>
			<div class="flex flex-col w-1/2 gap-5 mt-3">
				{#each selected.options as option}
					<Card.Root class="rounded-none">
						<Card.Content class="bg-primary-foreground p-3">
							{#if option.type === "number"}
								<Number {option} />
							{:else}
								<Toggle {option} />
							{/if}
						</Card.Content>
					</Card.Root>
				{/each}

				<Button>Start!</Button>
			</div>
		</div>
	</Tabs.Content>
</Tabs.Root>
