import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { AccountsTestData } from '../classes/accounts-test-data.class';
import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { getInputText } from '../utils/input.utils';

Given(
  /I reveal a private key and compare with (private key second seed|private key created account)/,
  async (inputType: AccountsTestData) => {
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
    const privateKeyType = getInputText(inputType);

    expect(revealedSecretsValue).eql(privateKeyType);
  }
);
