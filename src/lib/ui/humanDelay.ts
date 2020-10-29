export async function withErrorHumanDelay(callback: () => void | Promise<void>, err: Error | undefined, delay = 300) {
	if (process.env.NODE_ENV === "development") {
		console.error(err);
	}
	await new Promise((res) => setTimeout(res, delay));
	callback();
}
