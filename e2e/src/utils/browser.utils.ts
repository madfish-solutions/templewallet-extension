import path from 'path';
import { launch } from 'puppeteer';

const EXTENSION_PATH = path.resolve(__dirname, '../../../dist/chrome_unpacked');

export const initBrowser = () =>
  launch({
    headless: false,
    /* See: https://github.com/mujo-code/puppeteer-headful */
    executablePath: process.env.PUPPETEER_EXEC_PATH,
    args: ['--no-sandbox', `--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`]
  });
