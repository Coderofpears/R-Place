<script lang="ts">
    import * as Dialog from "$shared/ui/dialog";

    interface Props {
        title: string;
        text: string;
        onClose: () => void;
    }

    let { title, text, onClose }: Props = $props();
</script>

<Dialog.Root open onOpenChangeComplete={onClose}>
    <Dialog.Content class="block" style="max-width: min(760px, calc(100% - 32px))">
        <Dialog.Header class="font-bold text-lg w-full border-b">
            {title}
        </Dialog.Header>
        <pre class="whitespace-pre-wrap">{text}</pre>
    </Dialog.Content>
</Dialog.Root>
