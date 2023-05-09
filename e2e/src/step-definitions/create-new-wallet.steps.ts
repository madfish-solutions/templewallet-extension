import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I save my mnemonic/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const value = await Pages.NewSeedBackup.seedPhraseValue.getText();
  expect(value).eql(await Pages.NewSeedBackup.seedPhraseValue.getText());
  BrowserContext.seedPhrase = value;
});

Given(/I verify my mnemonic/, async () => {
  await Pages.VerifyMnemonic.enterSeedPhraseVerification();
});
