import { Given } from '@cucumber/cucumber';

import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';

Given(/I enter second mnemonic/, { timeout: MEDIUM_TIMEOUT }, async () => {
  await Pages.ImportAccountMnemonic.enterSeedPhrase(envVars.IMPORTED_HD_ACCOUNT_SEED_PHRASE);
});

Given(/I select (.*) tab/, async (tabName: string) => {
  await Pages.ImportAccountTab.selectTab(tabName);
});
