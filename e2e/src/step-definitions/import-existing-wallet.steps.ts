import { Given } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I enter default mnemonic/, async () => {
  await Pages.ImportExistingWallet.enterSeedPhrase(BrowserContext.seedPhrase);
});
