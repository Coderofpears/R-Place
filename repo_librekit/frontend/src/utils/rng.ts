export function shuffleArray(input: any[]): any[] {
	return input.sort(() => Math.random() - 0.5);
}

export function pickRandomArrayElement(input: any[]): any {
	return input[Math.floor(Math.random() * input.length)];
}
