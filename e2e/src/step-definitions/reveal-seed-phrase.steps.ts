import { Given } from '@cucumber/cucumber';

import { defaultSeedPhrase } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I compare my Seed Phrase to Revealed value/, async () => {
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  if (revealedSecretsValue === defaultSeedPhrase) {
    return true;
  }
});
