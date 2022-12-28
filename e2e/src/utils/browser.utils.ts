import path from 'path';
import { launch } from 'puppeteer';

const EXTENSION_PATH = path.resolve(__dirname, '../../../dist/chrome_unpacked');

export const initBrowser = () =>
  launch({
    headless: false,
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`]
  });
