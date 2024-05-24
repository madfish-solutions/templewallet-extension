import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { MEDIUM_TIMEOUT } from 'e2e/../../../e2e-tests/src/utils/timing.utils';

import { Pages } from '../../../e2e-tests/src/page-objects';
import { envVars } from '../../../e2e-tests/src/utils/env.utils';

Given(/I compare my Watch-only Public hash with imported account/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const getPublicHash = await Pages.Home.PublicAddressButton.getText();

  expect(getPublicHash).eql(envVars.WATCH_ONLY_PUBLIC_KEY_HASH_SHORT_FORM);
});
