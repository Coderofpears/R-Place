<script lang="ts">
    import { toast } from "svelte-sonner";
    import Check from "svelte-material-icons/Check.svelte";
    import Close from "svelte-material-icons/Close.svelte";

    interface Props {
        text: string;
        id: string;
        onConfirm: (confirmed: boolean) => void;
    }

    let { text, id, onConfirm }: Props = $props();

    function onClick(confirm: boolean) {
        toast.dismiss(id);
        onConfirm(confirm);
    }
</script>

<div class="flex items-center gap-1" onpointerdown={(e) => e.stopPropagation()}>
    <div class="pb-2 grow">{text}</div>
    <button onclick={() => onClick(true)}>
        <Check size={24} color="#925dfe" />
    </button>
    <button onclick={() => onClick(false)}>
        <Close size={24} color="#925dfe" />
    </button>
</div>

<style>
    :global(.confirm-toast-wrap > div) {
        width: 100%;
    }
</style>
