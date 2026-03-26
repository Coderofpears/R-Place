<script lang="ts">
    import type { Plugin } from "$core/scripts/plugin.svelte";
    import * as Dialog from "$shared/ui/dialog";
    import Setting from "./Setting.svelte";
    import SettingsGroup from "./SettingsGroup.svelte";

    interface Props {
        plugin: Plugin;
        onClose: () => void;
    }

    let { plugin, onClose }: Props = $props();

    const pluginName = plugin.headers.name;
</script>

<Dialog.Root open onOpenChangeComplete={onClose}>
    <Dialog.Content class="flex flex-col gap-2 text-gray-600" style="max-width: min(760px, calc(100% - 32px))">
        <Dialog.Header class="text-2xl font-bold! border-b-2">
            Settings for {pluginName}
        </Dialog.Header>
        <div class="min-h-0 overflow-auto">
            {#each plugin.settingsDescription as setting}
                {#if setting.type === "group"}
                    <SettingsGroup {pluginName} group={setting} />
                {:else}
                    <Setting {pluginName} {setting} />
                {/if}
            {/each}
        </div>
    </Dialog.Content>
</Dialog.Root>
