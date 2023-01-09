import { Browser } from 'puppeteer';

import { BrowserContext } from '../classes/browser-context.class';

export const initBrowserContext = async (browser: Browser) => {
  const [page] = await browser.pages();

  BrowserContext.browser = browser;
  BrowserContext.page = page;
};
