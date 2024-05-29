import { chromium, test as base, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import { CustomBrowserContext } from '../classes/browser-context.class';

let EXTENSION_ID = '';
let context: BrowserContext;
let page: Page;

export const test = base.extend<{
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    await use(context);
    await context.close()
    CustomBrowserContext.browser = context
  },
  extensionId: async ({ context }, use) => {
    if (EXTENSION_ID) return void (await use(EXTENSION_ID));

    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent('serviceworker');

    EXTENSION_ID = background.url().split('/')[2];
    await use(EXTENSION_ID);

    CustomBrowserContext.EXTENSION_ID = EXTENSION_ID
  }
});

export const expect = test.expect;

export { EXTENSION_ID, context, page };

test.beforeAll(async () => {
  const pathToExtension = path.join(process.cwd(), '../dist/chrome_unpacked');

  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--user-agent=E2EPipeline/0.0.1',
      '--disable-notifications']
  });
 console.log('it works still!!!')
  page = await context.newPage();
  CustomBrowserContext.browser = context
  CustomBrowserContext.EXTENSION_ID = EXTENSION_ID

});



test.afterAll(() => {
  // context.close();
  console.log('after all hook!')
});

test.afterEach(() => {
  console.log('after each hook!')
})
