import { BeforeAll } from '@cucumber/cucumber';

import { initBrowserContext } from '../utils/browser-context.utils';
import { initBrowser } from '../utils/browser.utils';
import { MEDIUM_TIMEOUT } from '../utils/timing.utils';

BeforeAll({ timeout: MEDIUM_TIMEOUT }, async () => {
  const browser = await initBrowser();

  await initBrowserContext(browser);
});
