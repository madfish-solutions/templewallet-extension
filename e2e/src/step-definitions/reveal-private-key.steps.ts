import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';

Given(/I compare my Private Key to Revealed value/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  expect(revealedSecretsValue).eql(envVars.DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY);
});
