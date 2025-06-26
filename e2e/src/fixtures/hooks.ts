/**
 * For the hooks lyfecycle, refer to: https://playwright.dev/docs/test-fixtures
 */

import retry from 'async-retry';
import { E2eMessageType } from 'src/lib/e2e/types';

import { CustomBrowserContext } from '../classes/browser-context.class';
import { WITH_EXTENSION_RESET } from '../utils/env.utils';
import { RETRY_OPTIONS } from '../utils/timing.utils';

import { test, openBrowser, browser, EXTENSION_ID } from './extension';

let EXTENSION_URL: string | undefined;

if (WITH_EXTENSION_RESET)
  test.beforeAll(async () => {
    const browser = await openBrowser();
    CustomBrowserContext.browser = browser;
  });

export function describeScenario(title: string, scenario: () => void) {
  test.describe(title, () => {
    test.beforeAll(({ extensionId }) => {
      if (!extensionId || EXTENSION_ID !== extensionId) throw new Error('Missmatch of extension ID');

      return beforeAll();
    });
    test.afterAll(afterAll);

    scenario();
  });
}

async function beforeAll() {
  if (!WITH_EXTENSION_RESET) {
    const browser = await openBrowser();
    CustomBrowserContext.browser = browser;
  }

  // On initial launch expecting Welcome page & will keep extension URL
  if (!EXTENSION_URL) {
    EXTENSION_URL = await retry(async () => {
      const pages = CustomBrowserContext.browser.pages();
      const extUrl = pages[1]?.url();

      if (!extUrl) throw new Error('Extension did not open Welcome page');

      return extUrl;
    }, RETRY_OPTIONS);
  }

  const pages = CustomBrowserContext.browser.pages();
  const lastPage = pages[pages.length - 1];
  CustomBrowserContext.page = lastPage;

  // With reset active, all scenarios, but 1st, will not have extension page open on its own.
  if (WITH_EXTENSION_RESET && lastPage.url() !== EXTENSION_URL) {
    CustomBrowserContext.page = await CustomBrowserContext.browser.newPage();
    await retry(async () => {
      await CustomBrowserContext.page.goto(EXTENSION_URL as string);
    }, RETRY_OPTIONS);
  }
}

async function afterAll() {
  if (WITH_EXTENSION_RESET) {
    await CustomBrowserContext.page.evaluate(message => new Promise(res => chrome.runtime.sendMessage(message, res)), {
      type: E2eMessageType.ResetRequest
    });
    await CustomBrowserContext.page.evaluate(() => localStorage.clear());

    // [ Extension reload ]

    await CustomBrowserContext.page.evaluate(() => chrome.runtime.reload()).catch(() => void 0);

    await CustomBrowserContext.page.video()?.saveAs('test-results/video-result.webm');

    await retry(() => {
      if (!CustomBrowserContext.page.isClosed()) throw new Error('Failed to reset extension');
    }, RETRY_OPTIONS);
  } else await browser.close();
}
