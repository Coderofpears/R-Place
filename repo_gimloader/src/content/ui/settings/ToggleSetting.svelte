<script lang="ts">
    import { Switch } from "$shared/ui/switch";

    let { value = $bindable() }: { value: boolean } = $props();
</script>

<Switch bind:checked={value} />
