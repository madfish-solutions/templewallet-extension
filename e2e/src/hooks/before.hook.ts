import { Before } from '@cucumber/cucumber';
import retry from 'async-retry';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';

import { CustomBrowserContext } from '../../../e2e-tests/src/classes/browser-context.class';
import { RETRY_OPTIONS, MEDIUM_TIMEOUT } from '../../../e2e-tests/src/utils/timing.utils';

const RECORDING_PATH = 'video-rep/test-runs.mp4';

Before({ timeout: MEDIUM_TIMEOUT }, async () => {
  await CustomBrowserContext.page.close().catch(() => void 0);

  const url = `chrome-extension://${CustomBrowserContext.EXTENSION_ID}/fullpage.html`;

  const page = await retry(async () => {
    const page = await CustomBrowserContext.browser.newPage();
    await page.setViewport({
      height: 800,
      width: 1300
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

  CustomBrowserContext.page = page;
  CustomBrowserContext.recorder = recorder;
  CustomBrowserContext.resetPrivates();
});
