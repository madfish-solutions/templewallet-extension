import { Before } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';

Before({ timeout: 5_000 }, async () => {
  try {
    await BrowserContext.page.close();
  } catch {}

  const url = `chrome-extension://${BrowserContext.EXTENSION_ID}/fullpage.html`;

  await (async function openPage() {
    const page = await BrowserContext.browser.newPage();
    try {
      await page.goto(url);
      BrowserContext.page = page;
    } catch {
      await page.close();
      await openPage();
    }
  })();
});
