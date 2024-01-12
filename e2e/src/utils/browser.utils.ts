import retry from 'async-retry';
import path from 'path';
import { Browser, launch } from 'puppeteer';

import { RETRY_OPTIONS } from './timing.utils';
const EXTENSION_PATH = path.resolve(__dirname, '../../../dist/chrome_unpacked');

export const initBrowser = () =>
  launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--user-agent=E2EPipeline/0.0.1',
      '--start-fullscreen',
      '--disable-notifications'
    ],
    slowMo: 10
  });

export const getExtensionId = async (browser: Browser) => {
  const background = await retry(async () => {
    const background = browser
      .targets()
      .find(
        target =>
          target.url().startsWith('chrome-extension://') &&
          ['service_worker', 'background_page'].includes(target.type())
      );

    if (background == null) throw new Error(`Extension not found`);

    return background;
  }, RETRY_OPTIONS);

  return new URL(background.url()).hostname;
};
