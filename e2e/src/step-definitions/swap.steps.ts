import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/src/page-objects';
import { iSelectTokenSlugs } from 'e2e/src/utils/input-data.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

Given(
  /I select (.*) token in the token drop-down list on the Swap page/,
  { timeout: MEDIUM_TIMEOUT },
  async (key: keyof typeof iSelectTokenSlugs) => {
    const assetsSlug = iSelectTokenSlugs[key];

    await Pages.Swap.selectAsset(assetsSlug);
  }
);
