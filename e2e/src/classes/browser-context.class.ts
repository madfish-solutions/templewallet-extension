import { Browser, Page } from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';

import { envVars } from '../utils/env.utils';

export class BrowserContext {
  public static EXTENSION_ID: string;
  public static browser: Browser;
  public static page: Page;
  public static seedPhrase = envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE;
  public static password = envVars.DEFAULT_PASSWORD;
  public static recorder: PuppeteerScreenRecorder;
  public static resetPrivates = () => {
    BrowserContext.seedPhrase = envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE;
    BrowserContext.password = envVars.DEFAULT_PASSWORD;
  };
}
