import { BeforeAll } from '@cucumber/cucumber';

import { initBrowserContext } from '../../../e2e-tests/src/utils/browser-context.utils';
import { initBrowser } from '../../../e2e-tests/src/utils/browser.utils';
import { MEDIUM_TIMEOUT } from '../../../e2e-tests/src/utils/timing.utils';

BeforeAll({ timeout: MEDIUM_TIMEOUT }, async () => {
  const browser = await initBrowser();

  await initBrowserContext(browser);
});
