<script lang="ts">
	import type { IToggleOption } from "$lib/types";
	import { Switch } from "$lib/components/ui/switch";

	export let option: IToggleOption;
	if (!option.value) option.value = option.default;
</script>

<div class="flex">
	<div class="flex-grow">
		{option.label}
	</div>

	<Switch bind:checked={option.value} />
</div>
