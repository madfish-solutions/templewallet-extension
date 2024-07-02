import { chromium, test as base, BrowserContext } from '@playwright/test';
import path from 'path';

let EXTENSION_ID = '';

export const test = base.extend<{
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    await use(browser);
  },
  extensionId: async ({ context }, use) => {
    if (EXTENSION_ID) return void (await use(EXTENSION_ID));

    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent('serviceworker');

    EXTENSION_ID = background.url().split('/')[2];
    await use(EXTENSION_ID);
  }
});

export const expect = test.expect;

let browser: BrowserContext;

export { EXTENSION_ID, browser };

export async function openBrowser() {
  const pathToExtension = path.join(process.cwd(), '../dist/chrome_unpacked');

  browser = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--disable-notifications'
    ],
    recordVideo: { dir: 'test-results/' }
  });

  return browser;
}
