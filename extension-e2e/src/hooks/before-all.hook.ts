import { BeforeAll } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';
import { initBrowserContext } from '../utils/browser-context.utils';
import { getExtensionId, initBrowser } from '../utils/browser.utils';

const LONG_TIMEOUT = 20 * 1000;
BeforeAll({ timeout: LONG_TIMEOUT }, async () => {
  const browser = await initBrowser();
  const extensionId = await getExtensionId(browser);
  const extensionUrl = `chrome-extension://${extensionId}/fullpage.html`;

  await initBrowserContext(browser);

  await BrowserContext.browser.defaultBrowserContext().overridePermissions(extensionUrl, ['clipboard-read']);

  await BrowserContext.page.goto(extensionUrl);
});
