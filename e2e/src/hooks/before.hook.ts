import { Before } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';

Before(async () => {
  await BrowserContext.page.evaluate(() => void localStorage.clear());
  await BrowserContext.page.reload();
});
