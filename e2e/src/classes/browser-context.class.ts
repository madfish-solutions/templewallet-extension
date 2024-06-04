import { BrowserContext, Page } from '@playwright/test';
// import { envVars } from '../utils/env.utils';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CustomBrowserContext {
  public static EXTENSION_URL: string;
  public static browser: BrowserContext;
  public static page: Page;
  // public static resetPrivates = () => {
  //   BrowserContext.seedPhrase = envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE;
  //   BrowserContext.password = envVars.DEFAULT_PASSWORD;
  // };
}
