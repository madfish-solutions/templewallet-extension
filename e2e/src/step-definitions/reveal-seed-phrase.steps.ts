import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { MEDIUM_TIMEOUT } from 'e2e/../../../e2e-tests/src/utils/timing.utils';

import { CustomBrowserContext } from '../../../e2e-tests/src/classes/browser-context.class';
import { Pages } from '../../../e2e-tests/src/page-objects';

Given(/I compare my Seed Phrase to Revealed value/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  expect(revealedSecretsValue).eql(CustomBrowserContext.seedPhrase);
});
