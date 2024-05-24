import { Given } from '@cucumber/cucumber';

import { MEDIUM_TIMEOUT } from 'e2e/../../../e2e-tests/src/utils/timing.utils';

import { CustomBrowserContext } from '../../../e2e-tests/src/classes/browser-context.class';
import { Pages } from '../../../e2e-tests/src/page-objects';

Given(/I save my mnemonic/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const value = await Pages.NewSeedBackup.seedPhraseValue.getText();

  CustomBrowserContext.seedPhrase = value;
});

Given(/I verify my mnemonic/, async () => {
  await Pages.VerifyMnemonic.enterSeedPhraseVerification();
});
