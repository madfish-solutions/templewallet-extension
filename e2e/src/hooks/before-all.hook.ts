import { BeforeAll } from '@cucumber/cucumber';

import { initBrowserContext } from '../utils/browser-context.utils';
import { initBrowser } from '../utils/browser.utils';
import { TWENTY_SECONDS_TIMEOUT } from '../utils/timing.utils';

BeforeAll({ timeout: TWENTY_SECONDS_TIMEOUT }, async () => {
  const browser = await initBrowser();

  await initBrowserContext(browser);
});
