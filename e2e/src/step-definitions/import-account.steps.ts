import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { getElementText } from '../utils/search.utils';

Given(/I enter second mnemonic/, async () => {
  await Pages.ImportAccountMnemonic.enterSecondMnemonicStep();
});

Given(/I select (.*) tab/, async (tabName: string) => {
  const tabElements = await Pages.ImportAccountTab.getTabSelectors();

  for (const tabElement of tabElements) {
    const getTabValue = await getElementText(tabElement);

    if (getTabValue === tabName) {
      await tabElement.click();
    }
  }
});

Given(/I reveal a private key and compare it/, async () => {
  await Pages.Header.isVisible();
  setTimeout(async () => await Pages.Header.accountIconButton.click(), 1000);
  await Pages.AccountsDropdown.isVisible();
  await Pages.AccountsDropdown.settingsButton.click();
  await Pages.Settings.isVisible();
  await Pages.Settings.revealPrivateKeyButton.click();
  await Pages.RevealSecrets.isVisible();
  await Pages.RevealSecrets.revealPasswordField.type(BrowserContext.password);
  await Pages.RevealSecrets.revealButton.click();
  await Pages.RevealSecrets.revealSecretsValue.getText();
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();

  expect(revealedSecretsValue).eql(BrowserContext.privateKeyOfSecondSeedPhrase);
});
