import { Tooltip as TooltipPrimitive } from "bits-ui";
import Trigger from "./tooltip-trigger.svelte";
import Content from "./tooltip-content.svelte";

const Root = TooltipPrimitive.Root;
const Provider = TooltipPrimitive.Provider;
const Portal = TooltipPrimitive.Portal;

export {
    Content,
    Content as TooltipContent,
    Portal,
    Portal as TooltipPortal,
    Provider,
    Provider as TooltipProvider,
    Root,
    //
    Root as Tooltip,
    Trigger,
    Trigger as TooltipTrigger
};
