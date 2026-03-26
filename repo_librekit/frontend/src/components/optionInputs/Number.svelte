<script lang="ts">
	import type { INumberOption } from "$lib/types";
	import { Input } from "$lib/components/ui/input";

	export let option: INumberOption;
	if (!option.value) option.value = option.default;

	function onKeyDown(e: KeyboardEvent) {
		if (e.ctrlKey || e.altKey || e.metaKey) return;

		// prevent non-numbers from being inputted
		if (e.key.length === 1 && isNaN(parseInt(e.key))) e.preventDefault();
	}

	function onChange() {
		if (!option.value) return;

		// clamp the value to the min and max
		if (option.min) {
			if (option.value < option.min) option.value = option.min;
		}
		if (option.max) {
			if (option.value > option.max) option.value = option.max;
		}
	}
</script>

<div class="flex items-center">
	<div class="flex-grow">
		{option.label}
	</div>
	<Input
		type="number"
		bind:value={option.value}
		on:keydown={onKeyDown}
		min={option.min}
		max={option.max}
		on:change={onChange}
		class="w-1/3"
	/>
</div>
