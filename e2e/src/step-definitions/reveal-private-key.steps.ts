import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { envVars } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I compare my Private Key to Revealed value/, async () => {
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  expect(revealedSecretsValue).eql(envVars.DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY);
});
