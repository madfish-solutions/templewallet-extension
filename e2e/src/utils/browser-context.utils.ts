import { Browser } from 'puppeteer';

import { BrowserContext } from '../classes/browser-context.class';

export const initBrowserContext = async (browser: Browser) => {
  /* Expecting for extension page to be opened by extension itself */
  await new Promise(resolve => setTimeout(resolve, 1_500));
  const pages = await browser.pages();

  const page = pages.find(p => p.url().startsWith('chrome-extension://'));

  if (page == null) throw new Error(`Initial extension page not found`);

  BrowserContext.EXTENSION_ID = new URL(page.url()).hostname;
  BrowserContext.browser = browser;
  BrowserContext.page = page;
};
