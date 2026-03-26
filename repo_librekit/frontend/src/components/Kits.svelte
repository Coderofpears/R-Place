<script lang="ts">
	import Play from "svelte-material-icons/Play.svelte";
	import ArchiveArrowUpOutline from "svelte-material-icons/ArchiveArrowUpOutline.svelte";

	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as Drawer from "$lib/components/ui/drawer";

	import { onMount } from "svelte";
	import type { IKit, IKitFolder } from "$lib/types";
	import { getConfig } from "$lib/utils/config";
	import API from "$lib/lkcore/api";

	import CreateButton from "$lib/components/kitComponents/CreateButton.svelte";
	import FolderDisplay from "$lib/components/kitComponents/FolderDisplay.svelte";
	import KitDropdown from "$lib/components/kitComponents/KitDropdown.svelte";
	import PlayDrawer from "$lib/components/PlayDrawer.svelte";

	let kits: IKit[] = [];
	let kitfolders: IKitFolder[] = [];
	let archivedKits: IKit[] = [];

	async function refetchKits() {
		const config = getConfig();
		const api = new API(config.apiBase);

		const response = await api.get("/api/games/summary/me");
		if (
			typeof response.message === "object" &&
			typeof response.message.text === "string"
		) {
			// We know something went wrong.
			// Redirect to the login page since that's the most likely
			// cause.
			location.href = "/login";
			return;
		}

		kits = [];
		kitfolders = [];
		archivedKits = [];

		console.info("Response:", response);

		// kits
		response.games.forEach((game: IKit) => {
			if (game.isArchived == false) {
				kits.push(game);
			}
		});
		response.games.forEach((game: IKit) => {
			if (game.isArchived == true) {
				kits.push(game);
				archivedKits.push(game)
			}
		});

		// kit folders
		response.folders.forEach((folder: IKitFolder) => {
			kitfolders.push(folder);
		});

		kits = kits;
		kitfolders = kitfolders;
		archivedKits = archivedKits;
	}
;

	let rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

	function fmtUpdatedAt(updatedAt: string) {
		let days = Math.round(
			(new Date(updatedAt).getTime() - Date.now()) / 1000 / 60 / 60 / 24
		);
		return rtf.format(days, "day");
	}

	let playOpen = false;
	let playingKit: Partial<IKit>;

	function play(kit: Partial<IKit>) {
		playOpen = true;
		playingKit = kit;
	}
	// set if a kit is archived or not
	async function setarchived(gameID: string, state: boolean) {
		const config = getConfig();
		const api = new API(config.apiBase);

		api.post("/api/games/archived", {
			archived: state,
			id: gameID
		}).then(refetchKits);
	}

	// confirm delete dialogs
	let confirmDeleteDialogs: any = {};
	for (let kit of kits) {
		confirmDeleteDialogs[kit._id] = false;
	}
	// view kit info dialogs
	let viewKitInfoDialogs: any = {};
	for (let kit of kits) {
		viewKitInfoDialogs[kit._id] = false;
	}
	// add to folder dialog
	let addToFolderDialog: any = {};
	for (let kit of kits) {
		addToFolderDialog[kit._id] = false;
	}
	// rename folder dialog
	let renameFolderDialog: any = {};
	for (let folder of kitfolders) {
		renameFolderDialog[folder._id] = false;
	}

	// selected kit folder
	let selectedKitFolder: any = "allkits";

	onMount(async () => {
		await refetchKits();
	});
</script>

<Drawer.Root bind:open={playOpen}>
	<Drawer.Content>
		<div class="flex flex-col w-full items-center pt-3" style="height: 80vh">
			<PlayDrawer kit={playingKit} />
		</div>
	</Drawer.Content>
</Drawer.Root>

<h1 class="text-8xl mb-3">Kits</h1>

<div class="grid grid-cols-8">
	<span class="col-span-7">
		<FolderDisplay
			refetchKits={refetchKits}
			kitfolders={kitfolders}
			renameFolderDialog={renameFolderDialog}
			bind:selectedKitFolder={selectedKitFolder}
		></FolderDisplay>
	</span>
	<span class="col-span-1 flex justify-end">
		<!-- the button that creates kits and folders-->
		<CreateButton refetchKits={refetchKits}></CreateButton>
	</span>
</div>

<div
	class="grid gap-6 pt-3 mb-16"
	style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))"
>
	{#each kits as kit}
		<!-- check if the kit is in the folder currently being shown -->
		{#if (selectedKitFolder == "archived" && kit.isArchived == true) || selectedKitFolder == "allkits" || (selectedKitFolder != "allkits" && selectedKitFolder != "archived" && selectedKitFolder.games.includes(kit._id))}
			<div>
				<img
					src={kit.gif}
					alt={kit.title}
					class="w-full h-60 object-cover rounded-xl hover:scale-105 transition-transform {kit.isArchived
						? 'brightness-[25%]'
						: ''}"
				/>
				<div class="flex items-center gap-2 mt-2">
					<div class="flex-grow">
						<div class="text-xl">
							{#if kit.isArchived == true}
								<Badge variant="secondary">Archived</Badge>
							{/if}
							{kit.title}
						</div>
						<div>
							Updated {fmtUpdatedAt(kit.updatedAt)}
						</div>
					</div>
					{#if kit.isArchived == false}
						<button class="border-2 rounded-full" on:click={() => play(kit)}>
							<div class="p-1">
								<Play width={30} height={30} />
							</div>
						</button>
						<!-- 
						the kit dropdown menu.
						all the stuff being passed into it is mainly just dialog lists
						and a few bits of info it needs to generate the dropdown
						like kit, what folder is selected, etc
						-->
						<KitDropdown
							refetchKits={refetchKits}
							kit={kit}
							kitFolders={kitfolders}
							selectedKitFolder={selectedKitFolder}

							viewKitInfoDialogs={viewKitInfoDialogs}
							addToFolderDialog={addToFolderDialog}
							confirmDeleteDialogs={confirmDeleteDialogs}
						></KitDropdown>
					{:else}
						<button
							class="border-2 rounded-full"
							on:click={() => setarchived(kit._id, false)}
						>
							<div class="p-1">
								<ArchiveArrowUpOutline width={30} height={30} />
							</div>
						</button>
					{/if}
				</div>
			</div>
		{/if}
	{/each}

	<!-- If the folder is empty, say the folder is empty. If there are no kits, say there are no kits.-->
	{#if (selectedKitFolder != "allkits" && selectedKitFolder != "archived") && selectedKitFolder.games.length == 0}
		This folder is empty.
	{/if}
	{#if (selectedKitFolder == "allkits" && kits.length == 0)}
		You have no kits.
	{/if}
	{#if (selectedKitFolder == "archived" && archivedKits.length == 0)}
		You haven't archived any kits.
	{/if}
</div>
