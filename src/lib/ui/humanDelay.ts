import { IS_DEV_ENV } from "app/defaults";


const DELAY = 300;

export async function withErrorHumanDelay(
  err: any,
  callback: () => void | Promise<void>
) {
  if (IS_DEV_ENV) {
    console.error(err);
  }
  await new Promise((res) => setTimeout(res, DELAY));
  callback();
}
