import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/../../../e2e-tests/src/page-objects';
import { VERY_LONG_TIMEOUT } from 'e2e/../../../e2e-tests/src/utils/timing.utils';

Given(/I wait until the time error goes away/, { timeout: VERY_LONG_TIMEOUT }, async () => {
  await Pages.UnlockScreen.isTimeErrorDisplayed();
});
