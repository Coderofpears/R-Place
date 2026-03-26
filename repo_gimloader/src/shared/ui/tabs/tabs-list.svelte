<script lang="ts">
    import { Tabs as TabsPrimitive } from "bits-ui";
    import { cn } from "$shared/shadcn.js";

    let {
        ref = $bindable(null),
        class: className,
        ...restProps
    }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
    bind:ref
    data-slot="tabs-list"
    class={cn(
        "text-muted-foreground flex flex-wrap gap-2 rounded-lg border-b",
        className
    )}
    {...restProps}
/>
