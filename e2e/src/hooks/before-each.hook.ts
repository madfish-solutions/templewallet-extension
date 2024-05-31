import { sleep } from 'e2e/src/utils/timing.utils';
import { CustomBrowserContext } from 'src/classes/browser-context.class';


export async function beforeEachHook() {
  await sleep(2000)
  const extensionURL = CustomBrowserContext.EXTENSION_URL

  if (CustomBrowserContext.page.url() !== extensionURL) {
    CustomBrowserContext.page = await CustomBrowserContext.browser.newPage()

    await CustomBrowserContext.page.goto(extensionURL)
  }

}
