import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { BrowserContext } from '../classes/browser-context.class';
import { testDataForInput } from '../classes/test-data-for-input.class';
import { Pages } from '../page-objects';

Given(/I reveal a private key and compare with (.*)/, async (inputType: keyof typeof testDataForInput) => {
  await Pages.Home.isVisible();
  await Pages.Header.accountIconButton.click();
  await Pages.AccountsDropdown.isVisible();
  await Pages.AccountsDropdown.settingsButton.click();
  await Pages.Settings.isVisible();
  await Pages.Settings.revealPrivateKeyButton.click();
  await Pages.RevealSecrets.isVisible();
  await Pages.RevealSecrets.revealPasswordField.type(BrowserContext.DEFAULT_PASSWORD);
  await Pages.RevealSecrets.revealButton.click();
  await Pages.RevealSecrets.revealSecretsValue.getText();
  const revealedSecretsValue = await Pages.RevealSecrets.revealSecretsValue.getText();
  const privateKeyType = testDataForInput[inputType];

  expect(revealedSecretsValue).eql(privateKeyType);
});
