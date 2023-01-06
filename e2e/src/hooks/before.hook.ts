import { Before } from '@cucumber/cucumber';

import { E2eRequest, E2eMessageType } from '../../../src/lib/e2e/types';
import { BrowserContext } from '../classes/browser-context.class';

const clearStorageMessage: E2eRequest = { type: E2eMessageType.ResetRequest };

Before(async () => {
  const $url = new URL(BrowserContext.page.url());
  const url = `${$url.protocol}//${$url.host}${$url.pathname}`;

  await BrowserContext.page.evaluate(
    // @ts-ignore
    message => new Promise(res => chrome.runtime.sendMessage(message, res)),
    clearStorageMessage
  );
  await BrowserContext.page.evaluate(() => void localStorage.clear());

  const { browser } = BrowserContext;
  const blankPage = await browser.newPage();
  await blankPage.goto('https://www.google.com/');

  // @ts-ignore
  await BrowserContext.page.evaluate(() => void chrome.runtime.reload());

  const page = await browser.newPage();
  await page.goto(url);
  BrowserContext.page = page;
  await blankPage.close();
});
