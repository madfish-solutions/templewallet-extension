import { test as base, BrowserContext } from '@playwright/test';
import { CustomBrowserContext } from '../classes/browser-context.class';


export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    await use(CustomBrowserContext.browser);
    await CustomBrowserContext.browser.close()
  },
  extensionId: async ({}, use) => {
  await use(CustomBrowserContext.EXTENSION_ID);
},
});

export const expect = test.expect;

