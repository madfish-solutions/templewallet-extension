import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { AccountsTestData } from '../classes/accounts';
import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { getPrivateKeyText } from '../utils/input.utils';

Given(/I enter second mnemonic/, async () => {
  await Pages.ImportAccountMnemonic.enterSeedPhrase(BrowserContext.secondSeedPhrase);
});

Given(/I select (.*) tab/, async (tabName: string) => {
  await Pages.ImportAccountTab.selectTab(tabName);
});

Given(
  /I reveal a private key and compare with (private key of second seed|private key of created account)/,
  async (compareType: AccountsTestData) => {
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
    const privateKeyType = getPrivateKeyText(compareType);

    expect(revealedSecretsValue).eql(privateKeyType);
  }
);
