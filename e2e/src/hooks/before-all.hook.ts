import { chromium } from '@playwright/test';
import path from 'path';

import { CustomBrowserContext } from '../classes/browser-context.class';

const pathToExtension = path.join(process.cwd(), '../dist/chrome_unpacked');

export async function beforeAllHook() {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--user-agent=E2EPipeline/0.0.1',
      '--disable-notifications'
    ]
  });

  CustomBrowserContext.browser = context;

  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
  ]);

  CustomBrowserContext.page = newPage;

  CustomBrowserContext.EXTENSION_URL = CustomBrowserContext.page.url();

  if (newPage.url() !== CustomBrowserContext.EXTENSION_URL) throw new Error('Extension was not opened')
}
