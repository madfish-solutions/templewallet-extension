import { Before } from '@cucumber/cucumber';
import retry from 'async-retry';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';

import { BrowserContext } from '../classes/browser-context.class';
import { RETRY_OPTIONS, MEDIUM_TIMEOUT } from '../utils/timing.utils';

const RECORDING_PATH = 'video-rep/test-runs.mp4';

Before({ timeout: MEDIUM_TIMEOUT }, async () => {
  await BrowserContext.page.close().catch(() => void 0);

  const url = `chrome-extension://${BrowserContext.EXTENSION_ID}/fullpage.html`;

  const page = await retry(async () => {
    const page = await BrowserContext.browser.newPage();
    await page.setViewport({
      height: 800,
      width: 800
    });
    try {
      const response = await page.goto(url);
      if (response == null || !response.ok) throw new Error('Failed to open page');
      return page;
    } catch (error) {
      await page.close();
      throw error;
    }
  }, RETRY_OPTIONS);

  const recorder = new PuppeteerScreenRecorder(page);

  await recorder.start(RECORDING_PATH);

  BrowserContext.page = page;
  BrowserContext.recorder = recorder;
  BrowserContext.resetPrivates();
});
