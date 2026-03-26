<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";

	let audio: HTMLAudioElement | null = null;

	function play(src: string) {
		if (audio) {
			audio.pause();
			audio.remove(); // just in case
			audio = null;
		}

		audio = new Audio(src);
		audio.play();
	}

	function playOGGVorbis() {
		play("/assets/soundtest/test.ogg");
	}

	function playMP3() {
		play("/assets/soundtest/test.mp3");
	}

	function playWAV() {
		play("/assets/soundtest/test.wav");
	}
</script>

<h1 class="mt-4 text-5xl">Sound test</h1>

<p>
	OGG Vorbis (<a
		href="https://opengameart.org/content/fear-me"
		class="text-blue-500 underline">original</a
	>)
</p>

<Button on:click={playOGGVorbis}>Play</Button>

<p>
	MP3 (<a
		href="https://opengameart.org/content/next-to-you"
		class="text-blue-500 underline">original</a
	>)
</p>

<Button on:click={playMP3}>Play</Button>

<p>
	WAV (<a
		href="https://opengameart.org/content/nes-shooter-music-5-tracks-3-jingles"
		class="text-blue-500 underline">original</a
	>)
</p>

<Button on:click={playWAV}>Play</Button>

<style>
	p {
		margin-top: 16px;
		margin-bottom: 16px;
	}
</style>
