import path from 'path';
import { Browser, launch } from 'puppeteer';

const EXTENSION_PATH = path.resolve(__dirname, '../../../dist/chrome_unpacked');

export const initBrowser = () =>
  launch({
    headless: false,
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`]
  });

export const getExtensionId = async (browser: Browser) => {
  const [page] = await browser.pages();
  // Needed to catch service worker
  await page.goto('https://www.google.com/');

  const extensionTarget = browser.targets().find(target => target.type() === 'background_page');

  if (extensionTarget === undefined) {
    throw Error('Extension not found');
  } else {
    const backgroundScriptUrl = extensionTarget.url();
    const [, , extensionId] = backgroundScriptUrl.split('/');

    return extensionId;
  }
};
