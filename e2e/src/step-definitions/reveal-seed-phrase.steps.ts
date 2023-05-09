import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I compare my Seed Phrase to Revealed value/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  expect(revealedSecretsValue).eql(BrowserContext.seedPhrase);
});
