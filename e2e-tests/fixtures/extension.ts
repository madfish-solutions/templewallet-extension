import { chromium, test as base, BrowserContext, Page } from '@playwright/test';
import path from 'path';

let EXTENSION_ID = '';

export const test = base.extend<{
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    await use(context);
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

let context: BrowserContext;
let page: Page;

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

  page = await context.newPage();
});


test.afterAll(() => {
  // context.close();
  console.log('after all hook!')
});

test.afterEach(() => {
  console.log('after each hook!')
})
