import { Before } from '@cucumber/cucumber';
import retry from 'async-retry';

import { BrowserContext } from '../classes/browser-context.class';
import { MEDIUM_TIMEOUT, RETRY_OPTIONS } from '../utils/timing.utils';

Before({ timeout: MEDIUM_TIMEOUT }, async () => {
  await BrowserContext.page.close().catch(() => void 0);

  const url = `chrome-extension://${BrowserContext.EXTENSION_ID}/fullpage.html`;

  const page = await retry(async () => {
    const page = await BrowserContext.browser.newPage();
    try {
      const response = await page.goto(url);
      if (response == null || !response.ok) throw new Error('Failed to open page');
      return page;
    } catch (error) {
      await page.close();
      throw error;
    }
  }, RETRY_OPTIONS);

  BrowserContext.page = page;
});
