import { BeforeAll } from '@cucumber/cucumber';

import { initBrowserContext } from '../utils/browser-context.utils';
import { initBrowser } from '../utils/browser.utils';

const LONG_TIMEOUT = 20 * 1000;
BeforeAll({ timeout: LONG_TIMEOUT }, async () => {
  const browser = await initBrowser();

  await initBrowserContext(browser);
});
