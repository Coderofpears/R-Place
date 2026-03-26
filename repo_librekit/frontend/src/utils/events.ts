export function isAprilFools(): boolean {
	const now = new Date();
	return now.getMonth() === 3 && now.getDate() === 1; // 3 + 1 = 4 (and 4 = April), then check if we're on the first day of the month
}
