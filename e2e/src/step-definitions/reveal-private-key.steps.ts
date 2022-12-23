import { Given } from '@cucumber/cucumber';

import { defaultPrivateKey } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I compare my Private Key to Revealed value/, async () => {
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  if (defaultPrivateKey === '') {
    throw Error('Your default Private Key is empty');
  } else if (revealedSecretsValue !== defaultPrivateKey) {
    throw Error('Revealed Private Key does not correspond to the default one');
  } else if (revealedSecretsValue === defaultPrivateKey) {
    return true;
  }
});
