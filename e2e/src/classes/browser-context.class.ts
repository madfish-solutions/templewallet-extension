import { Browser, Page } from 'puppeteer';

import { getEnv } from '../utils/env.utils';

export const envVars = {
  DEFAULT_HD_ACCOUNT_SEED_PHRASE: getEnv('DEFAULT_HD_ACCOUNT_SEED_PHRASE'),
  DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY: getEnv('DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY'),
  DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY: getEnv('DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY'),
  DEFAULT_PASSWORD: getEnv('DEFAULT_PASSWORD'),
  IMPORTED_HD_ACCOUNT_SEED_PHRASE: getEnv('IMPORTED_HD_ACCOUNT_SEED_PHRASE'),
  IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY: getEnv('IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY'),
  WATCH_ONLY_PUBLIC_KEY_HASH: getEnv('WATCH_ONLY_PUBLIC_KEY_HASH'),
  WATCH_ONLY_PUBLIC_KEY_HASH_SHORT_FORM: getEnv('WATCH_ONLY_PUBLIC_KEY_HASH_SHORT_FORM')
};

Object.entries(envVars).forEach(([key, val]) => {
  if (!val) throw new Error(`process.env.${key} not found`);
});

export class BrowserContext {
  public static EXTENSION_ID: string;
  public static browser: Browser;
  public static page: Page;
  public static seedPhrase = envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE;
  public static password = envVars.DEFAULT_PASSWORD;
  public static resetPrivates = () => {
    BrowserContext.seedPhrase = envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE;
    BrowserContext.password = envVars.DEFAULT_PASSWORD;
  };
}
