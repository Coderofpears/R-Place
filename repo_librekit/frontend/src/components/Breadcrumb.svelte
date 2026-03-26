<script lang="ts">
	import * as Breadcrumb from "$lib/components/ui/breadcrumb";
	import type { IPathSegment } from "$lib/types";

	export let path: IPathSegment[] = [];
	path.unshift({ href: "/", label: "Librekit" });
</script>

<Breadcrumb.Root>
	<Breadcrumb.List class="text-xl">
		{#each path.slice(0, -1) as segment}
			{#if segment.href}
				<Breadcrumb.Link href={segment.href}>
					{segment.label}
				</Breadcrumb.Link>
			{:else}
				<Breadcrumb.Page>
					{segment.label}
				</Breadcrumb.Page>
			{/if}
			<Breadcrumb.Separator>
				<div class="text-xl">/</div>
			</Breadcrumb.Separator>
		{/each}
		<Breadcrumb.Page>{path[path.length - 1].label}</Breadcrumb.Page>
	</Breadcrumb.List>
</Breadcrumb.Root>
