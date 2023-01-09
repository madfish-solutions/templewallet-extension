import retry from 'async-retry';
import { Browser } from 'puppeteer';

import { BrowserContext } from '../classes/browser-context.class';
import { RETRY_OPTIONS } from '../utils/timing.utils';

export const initBrowserContext = async (browser: Browser) => {
  /* Expecting for extension page to be opened by extension itself */

  const page = await retry(async () => {
    const pages = await browser.pages();

    const page = pages.find(p => p.url().startsWith('chrome-extension://'));

    if (page == null) throw new Error(`Initial extension page not found`);

    return page;
  }, RETRY_OPTIONS);

  BrowserContext.EXTENSION_ID = new URL(page.url()).hostname;
  BrowserContext.browser = browser;
  BrowserContext.page = page;
};
