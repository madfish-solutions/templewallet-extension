import path from "path";
import { chromium } from "@playwright/test";
import { CustomBrowserContext } from "../classes/browser-context.class";
import { sleep, VERY_SHORT_TIMEOUT } from "../utils/timing.utils";

const pathToExtension = path.join(process.cwd(), '../dist/chrome_unpacked');

export async function beforeAllHook() {

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--user-agent=E2EPipeline/0.0.1',
      '--disable-notifications']
  });

  CustomBrowserContext.browser = context


  await sleep(VERY_SHORT_TIMEOUT)

  CustomBrowserContext.page = CustomBrowserContext.browser.pages()[1]

  CustomBrowserContext.EXTENSION_URL =  CustomBrowserContext.page.url()

}
