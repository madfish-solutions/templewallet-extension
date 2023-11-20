import { Given } from '@cucumber/cucumber';

import { IEnterValuesKey, iEnterValues, iSelectTokenSlugs } from 'e2e/src/utils/input-data.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';

Given(/I wait until adding asset (.*) is preloaded/, { timeout: MEDIUM_TIMEOUT }, async (name: IEnterValuesKey) => {
  await Pages.AddAsset.waitAddingAssetPreloaded(iEnterValues[name]);
});

Given(
  /I check that (.*) page with (.*) token displayed or selected correctly/,
  // Token page has token symbol as page name and token name has its full name in asset banner component
  { timeout: MEDIUM_TIMEOUT },
  async (symbol: IEnterValuesKey, name: IEnterValuesKey) => {
    await Pages.Token.isCorrectPageSelected(iEnterValues[symbol], iEnterValues[name]);
  }
);

Given(
  /I check the token with name (.*) is displayed on the Home page/,
  { timeout: MEDIUM_TIMEOUT },
  async (name: string) => {
    await Pages.Home.isTokenDisplayed(name);
  }
);

Given(
  /I check the token with name (.*) is NOT displayed on the Home page/,
  // token full name will be checked in this test (example: kUSD = Kolibri)
  { timeout: MEDIUM_TIMEOUT },
  async (name: string) => {
    await Pages.Home.isTokenNotDisplayed(name);
  }
);

Given(
  /I check that (.*) is in the 'Manage Tokens' list/,
  { timeout: MEDIUM_TIMEOUT },
  async (slug: keyof typeof iSelectTokenSlugs) => {
    const assetsSlug = iSelectTokenSlugs[slug];

    if (assetsSlug === undefined) throw new Error(`${slug} key doesn't exist in the 'iSelectTokenSlugs' object`);
    await Pages.ManageAssetsTokens.isAssetInTokenList(assetsSlug);
  }
);

Given(
  /I click on (.*) token label to hide or reveal it/,
  { timeout: MEDIUM_TIMEOUT },
  async (slug: keyof typeof iSelectTokenSlugs) => {
    const assetsSlug = iSelectTokenSlugs[slug];

    if (assetsSlug === undefined) throw new Error(`${slug} key doesn't exist in the 'iSelectTokenSlugs' object`);
    await Pages.ManageAssetsTokens.interactVisibleAsset(assetsSlug);
  }
);

Given(
  /I click on delete token button of (.*) to reach confirm modal page/,
  { timeout: MEDIUM_TIMEOUT },
  async (slug: keyof typeof iSelectTokenSlugs) => {
    const assetsSlug = iSelectTokenSlugs[slug];

    if (assetsSlug === undefined) throw new Error(`${slug} key doesn't exist in the 'iSelectTokenSlugs' object`);
    await Pages.ManageAssetsTokens.clickDeleteAsset(assetsSlug);
  }
);

Given(
  /I check that (.*) token is deleted from token list/,
  { timeout: MEDIUM_TIMEOUT },
  async (slug: keyof typeof iSelectTokenSlugs) => {
    const assetsSlug = iSelectTokenSlugs[slug];

    if (assetsSlug === undefined) throw new Error(`${slug} key doesn't exist in the 'iSelectTokenSlugs' object`);
    await Pages.ManageAssetsTokens.isAssetDeleted(assetsSlug);
  }
);
