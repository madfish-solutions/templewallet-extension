import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/src/page-objects';
import { envVars } from 'e2e/src/utils/env.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

const hashObject = {
  defaultFirstAccount: envVars.DEFAULT_HD_ACCOUNT_FIRST_PUBLIC_KEY_HASH,
  defaultSecondAccount: envVars.DEFAULT_HD_ACCOUNT_SECOND_PUBLIC_KEY_HASH,
  importedAccount: envVars.IMPORTED_HD_ACCOUNT_FIRST_PUBLIC_KEY_HASH,
  watchOnlyAccount: envVars.WATCH_ONLY_PUBLIC_KEY_HASH
};

Given(
  /I select (.*) in the Account drop-down/,
  { timeout: MEDIUM_TIMEOUT },
  async (hashType: keyof typeof hashObject) => {
    const targetPkh = hashObject[hashType];

    if (targetPkh === undefined) throw new Error(`${hashType} not exist in the 'hashObject' object`);
    await Pages.AccountsDropdown.selectAccount(targetPkh);
  }
);
