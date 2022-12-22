import { Browser, Page } from 'puppeteer';

import { getEnv } from '../utils/env.utils';

const defaultSeedPhrase = getEnv('DEFAULT_SEED_PHRASE');
const defaultPassword = getEnv('DEFAULT_PASSWORD');
const defaultPrivateKey = getEnv('DEFAULT_HD_ACCOUNT_PRIVATE_KEY');

export class BrowserContext {
  public static browser: Browser;
  public static page: Page;
  public static seedPhrase = defaultSeedPhrase;
  public static password = defaultPassword;
  public static privateKey = defaultPrivateKey;
}
