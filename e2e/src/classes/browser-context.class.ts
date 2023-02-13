import { Browser, Page } from 'puppeteer';

import { getEnv } from '../utils/env.utils';

const DEFAULT_HD_ACCOUNT_SEED_PHRASE = getEnv('DEFAULT_HD_ACCOUNT_SEED_PHRASE');
const DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY = getEnv('DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY');
const DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY = getEnv('DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY');
const DEFAULT_PASSWORD = getEnv('DEFAULT_PASSWORD');
const IMPORTED_HD_ACCOUNT_SEED_PHRASE = getEnv('IMPORTED_HD_ACCOUNT_SEED_PHRASE');
const IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY = getEnv('IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY');

if (
  !DEFAULT_HD_ACCOUNT_SEED_PHRASE ||
  !DEFAULT_PASSWORD ||
  !DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY ||
  !DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY ||
  !IMPORTED_HD_ACCOUNT_SEED_PHRASE ||
  !IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY
)
  throw new Error('process.env.variable(s) not found.');

export class BrowserContext {
  public static EXTENSION_ID: string;
  public static browser: Browser;
  public static page: Page;
  public static defaultSeedPhrase = DEFAULT_HD_ACCOUNT_SEED_PHRASE;
  public static defaultFirstPrivateKey = DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY;
  public static defaultSecondPrivateKey = DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY;
  public static defaultPassword = DEFAULT_PASSWORD;
  public static importedSeedPhrase = IMPORTED_HD_ACCOUNT_SEED_PHRASE;
  public static importedFirstPrivateKey = IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY;
  public static resetPrivates = () => {
    BrowserContext.defaultSeedPhrase = DEFAULT_HD_ACCOUNT_SEED_PHRASE;
    BrowserContext.defaultPassword = DEFAULT_PASSWORD;
    BrowserContext.defaultFirstPrivateKey = DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY;
  };
}
