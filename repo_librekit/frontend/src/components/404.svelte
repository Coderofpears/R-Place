<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog";

	let pfpSize = 150;
	let punishDialogOpen = false;
	let personPunished = "";
</script>

<div class="h-screen" align="center">
	<h1 class="text-9xl">404</h1>
	<h1 class="text-2xl">This page does not exist.</h1>
	<h1 class="text-l mb-10">
		Which Librekit developer do you want to punish for this unacceptable
		failure?
	</h1>

	<div class="grid grid-cols-3 gap-8">
		<div align="center">
			<img
				src="https://codeberg.org/avatars/c2cb1379c2a59be63308f37b79b3c873de6e28b9fc4124dcc18d76d8d389a083?size=512"
				alt="Hexaheximal's PFP"
				width={pfpSize}
				class="rounded-full"
			/>
			<h1 class="text-3xl mb-5">Hexaheximal</h1>
			<Button
				class="hover:scale-110 transition-transform"
				on:click={() => {
					personPunished = "Hexaheximal";
					punishDialogOpen = true;
				}}>Punish</Button
			>
		</div>
		<div align="center">
			<img
				src="https://codeberg.org/avatars/301c9cf99e325024ebd38ffe35e593eeda2e60e9b84fd656797cba77247e7a04?size=512"
				alt="Blackhole927's PFP"
				width={pfpSize}
				class="rounded-full"
			/>
			<h1 class="text-3xl mb-5">Blackhole927</h1>
			<Button
				class="hover:scale-110 transition-transform"
				on:click={() => {
					personPunished = "Blackhole927";
					punishDialogOpen = true;
				}}>Punish</Button
			>
		</div>
		<div align="center">
			<img
				src="https://codeberg.org/avatars/d1faf37dedbee80e0517fb07d88757fbf7c6126ea687936e38a66abbf0fafa6d?size=512"
				alt="TheLazySquid's PFP"
				width={pfpSize}
				class="rounded-full"
			/>
			<h1 class="text-3xl mb-5">TheLazySquid</h1>
			<Button
				class="hover:scale-110 transition-transform"
				on:click={() => {
					personPunished = "TheLazySquid";
					punishDialogOpen = true;
				}}>Punish</Button
			>
		</div>
	</div>
	<div class="grid grid-cols-6 gap-8">
		<div class="col-span-1"></div>
		<div align="center" class="col-span-2">
			<img
				src="https://codeberg.org/avatars/bac1a12f0d04cb23f90274d1f1f9b021f66c75887db62179958d944f49180f31?size=512"
				alt="Windswipe's PFP"
				width={pfpSize}
				class="rounded-full"
			/>
			<h1 class="text-3xl mb-5">Windswipe</h1>
			<Button
				class="hover:scale-110 transition-transform"
				on:click={() => {
					personPunished = "Windswipe";
					punishDialogOpen = true;
				}}>Punish</Button
			>
		</div>
		<div align="center" class="col-span-2">
			<img
				src="https://codeberg.org/avatars/e0bcc283aab4cf5abaeb3ac190a9e5d804afa769cc4a8f23b1d8b7662ef19b5d?size=512"
				alt="Riptide's PFP"
				width={pfpSize}
				class="rounded-full"
			/>
			<h1 class="text-3xl mb-5">Riptide</h1>
			<Button
				class="hover:scale-110 transition-transform"
				on:click={() => {
					personPunished = "Riptide";
					punishDialogOpen = true;
				}}>Punish</Button
			>
		</div>
	</div>
</div>

<Dialog.Root
	bind:open={punishDialogOpen}
	closeOnOutsideClick={false}
	closeOnEscape={false}
>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Request filed!</Dialog.Title>
			<Dialog.Description>
				Your request to punish {personPunished} has been filed, and action will be
				taken as soon as is possible. In the meantime, you can return to the homepage
				and continue your Librekitting!
			</Dialog.Description>
		</Dialog.Header>
		<Button on:click={() => (window.location = "/")}>Return to Homepage</Button>
	</Dialog.Content>
</Dialog.Root>
