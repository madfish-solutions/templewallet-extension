import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/../../../e2e-tests/src/page-objects';
import { MEDIUM_TIMEOUT } from 'e2e/../../../e2e-tests/src/utils/timing.utils';

Given(/I check that tokens with zero balances are hidden/, { timeout: MEDIUM_TIMEOUT }, async () => {
  await Pages.Home.isZeroBalanceHidden();
});
