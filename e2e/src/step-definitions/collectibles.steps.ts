import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { Pages } from 'e2e/src/page-objects';
import { iSelectTokenSlugs } from 'e2e/src/utils/input-data.utils';
import { createPageElement } from 'e2e/src/utils/search.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

Given(
  /I check the collectible with name (.*) is displayed on the CollectiblesTab page/,
  { timeout: MEDIUM_TIMEOUT },
  async (symbol: string) => {
    await Pages.CollectiblesTabPage.isCollectibleDisplayed(symbol);
  }
);

Given(
  /I click on (.*) collectible to redirect on details page/,
  { timeout: MEDIUM_TIMEOUT },
  async (slug: keyof typeof iSelectTokenSlugs) => {
    const assetsSlug = iSelectTokenSlugs['TestNFT'];

    if (assetsSlug === undefined) throw new Error(`${slug} title doesn't exist in the 'iSelectTokenSlugs' object`);
    await Pages.CollectiblesTabPage.interactVisibleCollectible(slug);
  }
);

Given(
  /I check that (.*) page with (.*) collectible displayed correctly/,
  { timeout: MEDIUM_TIMEOUT },
  async (symbol: string, name: string) => {
    await Pages.CollectiblePage.isCorrectCollectibleSelected();
    const TokenTitle = await Pages.CollectiblePage.CollectibleTitle.getText();
    const targetTitle = 'The perfect NFT!';

    expect(TokenTitle).eql(targetTitle);
  }
);
