import { Browser, Page } from 'puppeteer';

import { getEnv } from '../utils/env.utils';

export const defaultSeedPhrase = getEnv('DEFAULT_SEED_PHRASE');
export const defaultPassword = getEnv('DEFAULT_PASSWORD');
export const defaultPrivateKey = getEnv('DEFAULT_HD_ACCOUNT_PRIVATE_KEY');

if (!defaultSeedPhrase) throw new Error('process.env.DEFAULT_SEED_PHRASE not found.');
if (!defaultPassword) throw new Error('process.env.DEFAULT_PASSWORD not found.');

export class BrowserContext {
  public static browser: Browser;
  public static page: Page;
}
