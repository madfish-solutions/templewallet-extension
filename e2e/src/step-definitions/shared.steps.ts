import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { OperationStatusSelectors } from '../../../src/app/templates/OperationStatus.selectors';
import { BrowserContext } from '../classes/browser-context.class';
import { testDataForInput } from '../classes/test-data-for-input.class';
import { Pages } from '../page-objects';
import { FORTY_SECONDS_TIMEOUT } from '../utils/timing.utils';

Given(/I reveal a private key and compare with (.*)/, async (inputType: keyof typeof testDataForInput) => {
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
  const privateKeyType = testDataForInput[inputType];

  expect(revealedSecretsValue).eql(privateKeyType);
});

Given(/I'm waiting for 'success ✓' operation status/, { timeout: FORTY_SECONDS_TIMEOUT }, async function () {
  await BrowserContext.page.waitForSelector(`[data-testid="${OperationStatusSelectors.successDoneOperation}"]`, {
    timeout: FORTY_SECONDS_TIMEOUT
  });
});
