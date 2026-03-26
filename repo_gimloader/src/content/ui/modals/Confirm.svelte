<script lang="ts">
    import Button from "$shared/ui/button/button.svelte";
    import * as Dialog from "$shared/ui/dialog";

    interface Props {
        title: string;
        text: string;
        onClose: (confirmed: boolean) => void;
    }

    let { title, text, onClose }: Props = $props();

    let open = $state(true);
    let confirmed = false;
    function onOpenChange() {
        onClose(confirmed);
    }

    function onCancelClick() {
        open = false;
        confirmed = false;
    }

    function onConfirmClick() {
        open = false;
        confirmed = true;
    }
</script>

<Dialog.Root bind:open onOpenChangeComplete={onOpenChange}>
    <Dialog.Content class="block" style="max-width: min(760px, calc(100% - 32px))">
        <Dialog.Header class="font-bold text-lg w-full border-b">
            {title}
        </Dialog.Header>
        <pre class="whitespace-pre-wrap">{text}</pre>
        <Dialog.Footer>
            <Button onclick={onCancelClick}>Cancel</Button>
            <Button onclick={onConfirmClick}>Confirm</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
