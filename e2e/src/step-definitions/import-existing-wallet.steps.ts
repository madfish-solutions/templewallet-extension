import { Given } from '@cucumber/cucumber';

import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I enter default mnemonic/, { timeout: MEDIUM_TIMEOUT }, async () => {
  await Pages.ImportExistingWallet.enterSeedPhrase(BrowserContext.seedPhrase);
});
