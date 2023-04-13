import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';

Given(/I compare my Private Key to Revealed value/, async () => {
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  expect(revealedSecretsValue).eql(envVars.DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY);
});
