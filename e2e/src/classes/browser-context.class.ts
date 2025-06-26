import { BrowserContext, Page } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CustomBrowserContext {
  public static EXTENSION_URL: string;
  public static browser: BrowserContext;
  public static page: Page;
  public static SEED_PHRASE: string;
}
