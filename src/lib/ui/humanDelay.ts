const DELAY = 300;

export async function withErrorHumanDelay(err: any, callback: () => void | Promise<void>) {
  console.error(err);
  await new Promise(res => setTimeout(res, DELAY));
  callback();
}
