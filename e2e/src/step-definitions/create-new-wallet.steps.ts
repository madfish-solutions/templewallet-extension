import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I save my mnemonic/, async () => {
  const value = await Pages.NewSeedBackup.seedPhraseValue.getText();
  expect(value).eql(await Pages.NewSeedBackup.seedPhraseValue.getText());
  BrowserContext.DEFAULT_HD_ACCOUNT_SEED_PHRASE = value;
});

Given(/I verify my mnemonic/, async () => {
  await Pages.VerifyMnemonic.enterSeedPhraseVerification();
});
