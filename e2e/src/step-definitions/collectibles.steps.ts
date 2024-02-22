import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { Pages } from 'e2e/src/page-objects';
import { iSelectTokensNames } from 'e2e/src/utils/input-data.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

Given(
  /I check the collectible with name (.*) is displayed on the CollectiblesTab page/,
  { timeout: MEDIUM_TIMEOUT },
  async (nameKey: keyof typeof iSelectTokensNames) => {
    const name = iSelectTokensNames[nameKey];

    await Pages.CollectiblesTabPage.isCollectibleDisplayed(name);
  }
);

Given(
  /I click on (.*) collectible to redirect to details page/,
  { timeout: MEDIUM_TIMEOUT },
  async (nameKey: keyof typeof iSelectTokensNames) => {
    const name = iSelectTokensNames[nameKey];
    await Pages.CollectiblesTabPage.clickOnCollectibleItem(name);
  }
);

Given(
  /I check that Collectible Page is opened for (.*)/,
  { timeout: MEDIUM_TIMEOUT },
  async (nameKey: keyof typeof iSelectTokensNames) => {
    await Pages.CollectiblePage.isVisible();

    const targetName = iSelectTokensNames[nameKey];
    const nameOnPage = await Pages.CollectiblePage.CollectibleTitle.getText();

    expect(nameOnPage).eql(targetName);
  }
);
