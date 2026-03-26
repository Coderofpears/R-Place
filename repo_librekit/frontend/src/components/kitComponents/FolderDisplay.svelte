<script lang="ts">
    import DotsHorizontal from "svelte-material-icons/DotsHorizontal.svelte";

    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Dialog from "$lib/components/ui/dialog";

    import { getConfig } from "$lib/utils/config";
	import API from "$lib/lkcore/api";
	import type { IKitFolder } from "$lib/types";


    export let refetchKits:()=> void;
    export let selectedKitFolder:any;
    export let kitfolders:IKitFolder[];
    export let renameFolderDialog:any[];

    // delete folder function
	async function deleteFolder(folderID:string) {
		const config = getConfig();
		const api = new API(config.apiBase);

		api.post("/api/folders/delete", {
			"id": folderID
		}).then(refetchKits);
	}
	
	// rename folder function
	async function renameFolder(folderID:string, newName:string) {
		const config = getConfig();
		const api = new API(config.apiBase);

		api.post("/api/folders/rename", {
			"id": folderID,
			"title": newName
		}).then(refetchKits);
	}

    //
    let renameFolderName:string=""
</script>

<Button
    class="h-8"
    variant={selectedKitFolder == "allkits" ? "default" : "secondary"}
    on:click={() => (selectedKitFolder = "allkits")}>All Kits</Button
>
<Button
    class="h-8"
    variant={selectedKitFolder == "archived" ? "default" : "secondary"}
    on:click={() => (selectedKitFolder = "archived")}>Archived</Button
>
{#each kitfolders as folder}
    <Button
        class="h-8 transition-transform mb-1"
        variant={selectedKitFolder == folder ? "default" : "secondary"}
        on:click={() => (selectedKitFolder = folder)}
    >
        {folder.title}
        {#if (selectedKitFolder == folder)}
            <DropdownMenu.Root preventScroll={false}>
                <DropdownMenu.Trigger>
                    <DotsHorizontal class="ml-2" width={15} height={15} />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    <DropdownMenu.Item class="h-8" on:click={()=>renameFolderDialog[folder._id]=true}>
                        Rename Folder
                    </DropdownMenu.Item>
                    <DropdownMenu.Item class="h-8" on:click={()=>deleteFolder(folder._id)}>
                        <span class="text-red-500">Delete Folder</span>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        {/if}
    </Button>

    <Dialog.Root bind:open={renameFolderDialog[folder._id]}>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>Rename Folder</Dialog.Title>
                <Dialog.Description>
                    What do you want to rename "{folder.title}" to?
                </Dialog.Description>
            </Dialog.Header>
            <Input placeholder="New folder name..." bind:value={renameFolderName}></Input>
            <Dialog.Close class="w-48">
                <div class="grid grid-cols-2 w-48 gap-4">
                    <Button class="w-24" variant="default" on:click={()=>renameFolder(folder._id, renameFolderName)}>Rename</Button>
                    <Button class="w-24" variant="outline">Cancel</Button>
                </div>
            </Dialog.Close>
        </Dialog.Content>
    </Dialog.Root>
{/each}