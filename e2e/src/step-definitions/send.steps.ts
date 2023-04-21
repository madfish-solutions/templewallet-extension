import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/src/page-objects';
import { iSelectTokenSlugs } from 'e2e/src/utils/input-data.utils';

Given(
  /I select (.*) token in the token drop-down list on the Send page/,
  async (key: keyof typeof iSelectTokenSlugs) => {
    const slug = iSelectTokenSlugs[key];

    await Pages.Send.selectToken(slug);
  }
);
