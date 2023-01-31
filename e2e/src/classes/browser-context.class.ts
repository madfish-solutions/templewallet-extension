import { Browser, Page } from 'puppeteer';

import { getEnv } from '../utils/env.utils';

const defaultSeedPhrase = getEnv('DEFAULT_SEED_PHRASE');
const defaultPassword = getEnv('DEFAULT_PASSWORD');
const defaultPrivateKey = getEnv('DEFAULT_HD_ACCOUNT_PRIVATE_KEY');
const secondSeedPhrase = getEnv('SECOND_SEED_PHRASE');
const privateKeyOfSecondSeedPhrase = getEnv('SECOND_SEED_PHRASE_PRIVATE_KEY');

if (!defaultSeedPhrase) throw new Error('process.env.DEFAULT_SEED_PHRASE not found.');
if (!defaultPassword) throw new Error('process.env.DEFAULT_PASSWORD not found.');
if (!defaultPrivateKey) throw new Error('process.env.DEFAULT_PASSWORD not found.');
if (!secondSeedPhrase) throw new Error('process.env.SECOND_SEED_PHRASE not found.');
if (!privateKeyOfSecondSeedPhrase) throw new Error('process.env.PRIVATE_KEY_OF_SECOND_SEED_PHRASE not found.');

export class BrowserContext {
  public static EXTENSION_ID: string;
  public static browser: Browser;
  public static page: Page;
  public static seedPhrase = defaultSeedPhrase;
  public static password = defaultPassword;
  public static privateKey = defaultPrivateKey;
  public static secondSeedPhrase = secondSeedPhrase;
  public static privateKeyOfSecondSeedPhrase = privateKeyOfSecondSeedPhrase;
  public static resetPrivates = () => {
    BrowserContext.seedPhrase = defaultSeedPhrase;
    BrowserContext.password = defaultPassword;
    BrowserContext.privateKey = defaultPrivateKey;
  };
}
