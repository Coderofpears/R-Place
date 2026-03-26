<script lang="ts">
    import Check from "lucide-svelte/icons/check";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import * as Command from "$lib/components/ui/command/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { cn } from "$lib/utils/shadcn.js";
    import { tick } from "svelte";

    export let optionName:string;
    export let options;

    // options is a dictionary of values and labels
    // format into a list of dicts that have value: and label: values.
    
    let nOptions:any = []
    Object.entries(options).forEach(([key, value]) => {
        nOptions.push({value:value, label:value})
    });
    options = nOptions
    
    let open = false;
    export let value = "";
   
    $: selectedValue =
        options.find((f) => f.value === value)?.label ??
        "Select a " + optionName + "...";
   
    // We want to refocus the trigger button when the user selects
    // an item from the list so users can continue navigating the
    // rest of the form with the keyboard.
    function closeAndFocusTrigger(triggerId: string) {
        open = false;
        tick().then(() => {
            document.getElementById(triggerId)?.focus();
        });
    }
</script>

<Popover.Root bind:open let:ids>
    <Popover.Trigger asChild let:builder>
        <Button
            builders={[builder]}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            class="w-[200px] justify-between"
        >
            {selectedValue}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
    </Popover.Trigger>
    <Popover.Content class="w-[200px] h-[300px] p-0">
        <Command.Root>
            <Command.Input placeholder="Search {optionName}s..." />
            <Command.Empty>No {optionName} found.</Command.Empty>
            <Command.Group>
                {#each options as option}
                    <Command.Item
                        value={option.value}
                        onSelect={(currentValue) => {
                            value = currentValue;
                            closeAndFocusTrigger(ids.trigger);
                        }}
                    >
                        <Check
                            class={cn(
                                "mr-2 h-4 w-4",
                                value !== option.value && "text-transparent"
                            )}
                        />
                        {option.label}
                    </Command.Item>
                {/each}
            </Command.Group>
        </Command.Root>
    </Popover.Content>
</Popover.Root>