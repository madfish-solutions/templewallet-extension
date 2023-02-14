import { Given } from '@cucumber/cucumber';

import { envVars } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I enter second mnemonic/, async () => {
  await Pages.ImportAccountMnemonic.enterSeedPhrase(envVars.IMPORTED_HD_ACCOUNT_SEED_PHRASE);
});

Given(/I select (.*) tab/, async (tabName: string) => {
  await Pages.ImportAccountTab.selectTab(tabName);
});
