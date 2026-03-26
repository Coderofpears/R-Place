import type { IGamemode, IOption } from "$lib/types";

const classicOptions: IOption[] = [
	{
		type: "number",
		id: "starting_cash",
		label: "💸 Starting Cash",
		default: 10
	},
	{
		type: "toggle",
		id: "music",
		label: "🎵 Music",
		default: true
	}
];

// the joke is that we only have classic
let gamemodes: IGamemode[] = [
	{
		name: "Classic",
		description: "Answer questions to earn cash and win the game.",
		id: "classic",
		emoji: "🏆",
		options: classicOptions
	}
];

export default gamemodes;
