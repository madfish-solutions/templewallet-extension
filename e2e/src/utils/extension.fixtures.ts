import { test as base, BrowserContext, Page } from '@playwright/test';

import { CustomBrowserContext } from '../classes/browser-context.class';

let context: BrowserContext;
let page: Page;

export const test = base.extend<{}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    await use(context);
    CustomBrowserContext.browser = context;
  }
});

export const expect = test.expect;

export { context, page };
