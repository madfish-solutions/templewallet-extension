import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';
import { OperationStatusSelectors } from 'src/app/templates/OperationStatus.selectors';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';
import { iComparePrivateKeys } from '../utils/input-data.utils';
import { LONG_TIMEOUT, MEDIUM_TIMEOUT } from '../utils/timing.utils';

Given(
  /I reveal a private key and compare with (.*)/,
  { timeout: MEDIUM_TIMEOUT },
  async (key: keyof typeof iComparePrivateKeys) => {
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
    const privateKeyType = iComparePrivateKeys[key];

    expect(revealedSecretsValue).eql(privateKeyType);
  }
);

Given(/I'm waiting for 'success ✓' operation status/, { timeout: LONG_TIMEOUT }, async () => {
  await BrowserContext.page.waitForSelector(`[data-testid="${OperationStatusSelectors.successDoneOperation}"]`, {
    timeout: LONG_TIMEOUT
  });
});

const hashObject = {
  defaultAccountShortHash: envVars.DEFAULT_HD_ACCOUNT_FIRST_HASH_SHORT_FORM,
  importedAccountShortHash: envVars.IMPORTED_HD_ACCOUNT_FIRST_HASH_SHORT_FORM,
  watchOnlyAccountShortHash: envVars.WATCH_ONLY_PUBLIC_KEY_HASH_SHORT_FORM
};

Given(
  /I check if (.*) is corresponded to the selected account/,
  { timeout: MEDIUM_TIMEOUT },
  async (hashType: keyof typeof hashObject) => {
    const pkhFromUI = await Pages.Home.PublicAddressButton.getText();
    const targetPkh = hashObject[hashType];

    expect(pkhFromUI).eql(targetPkh);
  }
);
