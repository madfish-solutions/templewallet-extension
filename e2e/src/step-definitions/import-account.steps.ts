import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { ImportAccountTestIds } from '../../../src/app/pages/ImportAccount/ImportAccount.test-ids';
import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { findElements, getElementText } from '../utils/search.utils';

Given(/I enter second mnemonic/, async () => {
  await Pages.ImportAccountMnemonic.enterSeedPhrase(BrowserContext.secondSeedPhrase);
});

Given(/I select (.*) tab/, async (tabName: string) => {
  const tabElements = await findElements(ImportAccountTestIds.tabSwitcher);

  for (const tabElement of tabElements) {
    const getTabValue = await getElementText(tabElement);

    if (getTabValue === tabName) {
      await tabElement.click();
    }
  }
});

Given(/I reveal a private key and compare with private key of second seed phrase/, async () => {
  await Pages.Home.isVisible();
  await Pages.Header.accountIconButton.click();
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
