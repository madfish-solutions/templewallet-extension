import { CustomBrowserContext } from '../classes/browser-context.class';
import { sleep } from '../utils/timing.utils';

export async function beforeEachHook() {
  await sleep(2000);
  const extensionURL = CustomBrowserContext.EXTENSION_URL;

  if (CustomBrowserContext.page.url() !== extensionURL) {
    CustomBrowserContext.page = await CustomBrowserContext.browser.newPage();

    await CustomBrowserContext.page.goto(extensionURL);
  }
}
