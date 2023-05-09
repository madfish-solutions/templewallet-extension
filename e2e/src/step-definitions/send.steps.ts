import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/src/page-objects';
import { iSelectTokenSlugs } from 'e2e/src/utils/input-data.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

Given(
  /I select (.*) token in the token drop-down list on the Send page/,
  { timeout: MEDIUM_TIMEOUT },
  async (key: keyof typeof iSelectTokenSlugs) => {
    const slug = iSelectTokenSlugs[key];

    await Pages.Send.selectToken(slug);
  }
);
