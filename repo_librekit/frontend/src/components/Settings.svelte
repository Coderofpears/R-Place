<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { tick } from "svelte";
	import Settings from "svelte-material-icons/CogOutline.svelte";
	import { getConfig } from "$lib/utils/config";
	import API from "$lib/lkcore/api";
	import { LogOut } from "lucide-svelte";
	import { isAprilFools } from "$lib/utils/events";
	import { pickRandomArrayElement } from "$lib/utils/rng";

	let darkMode = true;
	let showLogout = false;
	let developerMode = false;

	if (typeof window !== "undefined") {
		developerMode = localStorage.getItem("developer-mode") === "true";

		if (isAprilFools()) {
			window.addEventListener("click", () => {
				if (Math.floor(Math.random() * 2) === 0) {
					new Audio(
						pickRandomArrayElement([
							"/assets/events/aprilfools/blipSelect.wav",
							"/assets/events/aprilfools/click.wav",
							"/assets/events/aprilfools/explosion.wav",
							"/assets/events/aprilfools/hitHurt.wav",
							"/assets/events/aprilfools/jump.wav",
							"/assets/events/aprilfools/powerUp.wav",
							"/assets/events/aprilfools/synth.wav"
						])
					).play();
				}
			});
		}

		(async () => {
			const config = getConfig();
			const api = new API(config.apiBase);

			(window as any).api = api;

			const response = await api.get("/pages/general");

			if (typeof response.message === "undefined" && response.userData) {
				showLogout = true;
			}
		})();
	}

	async function logout() {
		const config = getConfig();
		const api = new API(config.apiBase);

		(window as any).api = api;

		await api.getPlaintext("/logout");

		localStorage.clear();

		location.href = "/";
	}

	async function toggleDarkMode() {
		await tick();
		document.documentElement.classList.toggle("dark", darkMode);
	}

	function toggleDeveloperMode() {
		if (developerMode) {
			localStorage.removeItem("developer-mode");
			developerMode = false;
		} else {
			localStorage.setItem("developer-mode", "true");
			developerMode = true;
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Settings width="30" height="30" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Label>Settings</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>Appearance</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<DropdownMenu.CheckboxItem
					bind:checked={darkMode}
					on:click={toggleDarkMode}
				>
					Dark Mode
				</DropdownMenu.CheckboxItem>
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>

		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>Advanced</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<DropdownMenu.CheckboxItem
					bind:checked={developerMode}
					on:click={toggleDeveloperMode}
				>
					Developer mode
				</DropdownMenu.CheckboxItem>
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>

		{#if showLogout}
			<DropdownMenu.Item on:click={logout}>
				<LogOut class="mr-2 h-4 w-4" />
				<span>Log out</span>
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
