import retry from 'async-retry';
import { Browser } from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';

import { BrowserContext } from '../classes/browser-context.class';

import { getExtensionId } from './browser.utils';
import { RETRY_OPTIONS } from './timing.utils';

export const initBrowserContext = async (browser: Browser) => {
  const extensionId = await getExtensionId(browser);

  const url = `chrome-extension://${extensionId}`;

  /* Expecting for extension page to be opened by extension itself */
  const page = await retry(async () => {
    const pages = await browser.pages();

    const page = pages.find(p => p.url().startsWith(url));

    if (page == null) throw new Error(`Initial extension page not found`);

    return page;
  }, RETRY_OPTIONS);

  BrowserContext.EXTENSION_ID = extensionId;
  BrowserContext.browser = browser;
  BrowserContext.page = page;
  BrowserContext.recorder = new PuppeteerScreenRecorder(BrowserContext.page);
};
