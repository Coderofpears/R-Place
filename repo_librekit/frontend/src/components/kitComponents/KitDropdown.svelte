<script lang="ts">

    import DotsHorizontal from "svelte-material-icons/DotsHorizontal.svelte";

    import { Button } from "$lib/components/ui/button/index.js";
    import * as Select from "$lib/components/ui/select";
    import * as Dialog from "$lib/components/ui/dialog";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

    import { getConfig } from "$lib/utils/config";
	import API from "$lib/lkcore/api";
	import type { IKit, IKitFolder } from "$lib/types";

    export let refetchKits:()=>void
    export let kit:IKit
    export let selectedKitFolder:any
    export let kitFolders:IKitFolder[]


    export let viewKitInfoDialogs:boolean[];
    export let addToFolderDialog:boolean[];
    export let confirmDeleteDialogs:boolean[];

    function edit(kitID: string) {
		location.href = "/kits/edit?id=" + kitID;
	}

    let addToFolderDialogSelectedKitFolder:string = ""

    // dropdown functions
	async function deletekit(gameID: string) {
		const config = getConfig();
		const api = new API(config.apiBase);

		api.post("/api/games/delete", {
			id: gameID
		}).then(refetchKits);
	}
	async function addKitToFolder(kitID:string, folderID:string) {
		const config = getConfig();
		const api = new API(config.apiBase);

		api.post("/api/folders/addGame", {
			folderId : folderID,
			gameId: kitID
		}).then(refetchKits);
	}
	async function removeKitFromFolder(kitID:string, folderID:string) {
		const config = getConfig();
		const api = new API(config.apiBase);

		api.post("/api/folders/removeGame", {
			folderId : folderID,
			gameId: kitID
		}).then(refetchKits);
	}
	async function setarchived(gameID: string, state: boolean) {
		const config = getConfig();
		const api = new API(config.apiBase);

		api.post("/api/games/archived", {
			archived: state,
			id: gameID
		}).then(refetchKits);
	}

    let rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    function fmtUpdatedAt(updatedAt: string) {
		let days = Math.round(
			(new Date(updatedAt).getTime() - Date.now()) / 1000 / 60 / 60 / 24
		);
		return rtf.format(days, "day");
	}
</script>

<DropdownMenu.Root preventScroll={false}>
    <DropdownMenu.Trigger>
        <button class="border-2 rounded-full">
            <div class="p-1">
                <DotsHorizontal width={30} height={30} />
            </div>
        </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
        <DropdownMenu.Item
            on:click={() => edit(kit._id)}
            class="text-center"
        >
            Edit
        </DropdownMenu.Item>
        <DropdownMenu.Item
            on:click={() => (viewKitInfoDialogs[kit._id] = true)}
        >
            View Info
        </DropdownMenu.Item>
        <DropdownMenu.Item
            on:click={() => (addToFolderDialog[kit._id] = true)}
        >
            Add to Folder
        </DropdownMenu.Item>
        {#if selectedKitFolder != "allkits" && selectedKitFolder != "archived"}
            <DropdownMenu.Item
                on:click={() => (removeKitFromFolder(kit._id, selectedKitFolder._id))}
            >
                Remove from Folder
            </DropdownMenu.Item>
        {/if}
        <DropdownMenu.Item
            on:click={() => setarchived(kit._id, true)}
            class="text-center"
        >
            Archive
        </DropdownMenu.Item>
        <DropdownMenu.Item
            on:click={() => (confirmDeleteDialogs[kit._id] = true)}
        >
            <span class="text-red-500">Delete</span>
        </DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>

<!-- this code is genius and you can't change my mind -->
<Dialog.Root bind:open={confirmDeleteDialogs[kit._id]}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Are you sure?</Dialog.Title>
            <Dialog.Description>
                Do you want to delete the kit "{kit.title}"?
            </Dialog.Description>
        </Dialog.Header>
        <Dialog.Close>
            <div class="grid grid-cols-2 w-48 gap-4">
                <Button class="w-24" variant="outline">Cancel</Button>
                <Button
                    class="w-24"
                    variant="destructive"
                    on:click={() => {
                        deletekit(kit._id);
                    }}>Delete</Button
                >
            </div>
        </Dialog.Close>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={viewKitInfoDialogs[kit._id]}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Info on "{kit.title}"</Dialog.Title>
            <Dialog.Description>
                Created: {fmtUpdatedAt(kit.createdAt)}<br />
                Updated: {fmtUpdatedAt(kit.updatedAt)}<br />
                Subject: {kit.subject}<br />
                Public: {kit.privacy == "public" ? "true" : "false"}<br />
                Edits: {kit.editCount}<br />
                Kit ID: {kit._id}<br />
                Creator ID: {kit.creator}<br />
                Language: {kit.lang}<br />
            </Dialog.Description>
        </Dialog.Header>
        <Dialog.Close>
            <Button class="w-24" variant="outline">Ok</Button>
        </Dialog.Close>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={addToFolderDialog[kit._id]}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title class="mb-5">Add "{kit.title}" to a folder</Dialog.Title>
            <Select.Root onSelectedChange={(value)=>{addToFolderDialogSelectedKitFolder=value.value}}>
                <Select.Trigger class="w-[200px]">
                    <Select.Value placeholder="Select Folder" />
                </Select.Trigger>
                <Select.Content>
                    {#each kitFolders as folder}
                        <Select.Item value="{folder._id}">{folder.title}</Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
        </Dialog.Header>
        <Dialog.Close>
            <Button class="w-24" on:click={()=>addKitToFolder(kit._id, addToFolderDialogSelectedKitFolder)}>Add</Button>
            <Button class="w-24" variant="outline">Cancel</Button>
        </Dialog.Close>
    </Dialog.Content>
</Dialog.Root>