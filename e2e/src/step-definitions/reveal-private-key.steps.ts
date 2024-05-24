import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { MEDIUM_TIMEOUT } from 'e2e/../../../e2e-tests/src/utils/timing.utils';

import { Pages } from '../../../e2e-tests/src/page-objects';
import { envVars } from '../../../e2e-tests/src/utils/env.utils';

Given(/I compare my Private Key to Revealed value/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  expect(revealedSecretsValue).eql(envVars.DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY);
});
