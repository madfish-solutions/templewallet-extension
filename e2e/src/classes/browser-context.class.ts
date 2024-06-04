import { BrowserContext, Page } from '@playwright/test';

export class CustomBrowserContext {
  public static EXTENSION_URL: string;
  public static browser: BrowserContext;
  public static page: Page;
}
