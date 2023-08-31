import { Given } from '@cucumber/cucumber';

import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';

Given(/I wait until other inputs load after entering a token address/, { timeout: MEDIUM_TIMEOUT }, async () => {
  await Pages.AddAsset.waitForOtherInputs();
});

Given(
  /I check that (.*) page with (.*) token displayed or selected correctly/,
  // Token page has token symbol as page name and token name has full its full name in asset banner component
  { timeout: MEDIUM_TIMEOUT },
  async (symbol: string, name: string) => {
    await Pages.Token.isCorrectPageSelected(symbol, name);
  }
);

Given(/I check the (.*) token is displayed on the Home page/, { timeout: MEDIUM_TIMEOUT }, async (name: string) => {
  await Pages.Home.isTokenDisplayed(name);
});
