<script lang="ts">
    import { Tabs as TabsPrimitive } from "bits-ui";
    import { cn } from "$shared/shadcn.js";

    let {
        ref = $bindable(null),
        class: className,
        ...restProps
    }: TabsPrimitive.ContentProps = $props();
</script>

<TabsPrimitive.Content
    bind:ref
    data-slot="tabs-content"
    class={cn("flex-1 min-h-0 outline-none", className)}
    {...restProps}
/>
