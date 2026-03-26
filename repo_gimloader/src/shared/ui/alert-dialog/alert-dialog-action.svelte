<script lang="ts">
    import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
    import { buttonVariants } from "$shared/ui/button/index.js";
    import { cn } from "$shared/shadcn.js";

    let {
        ref = $bindable(null),
        class: className,
        ...restProps
    }: AlertDialogPrimitive.ActionProps = $props();
</script>

<AlertDialogPrimitive.Action
    bind:ref
    data-slot="alert-dialog-action"
    class={cn(buttonVariants(), className)}
    {...restProps}
/>
