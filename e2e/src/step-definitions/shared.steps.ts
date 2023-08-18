import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';
import { OperationStatusSelectors } from 'src/app/templates/OperationStatus.selectors';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';
import { iComparePrivateKeys } from '../utils/input-data.utils';
import { createPageElement, findElement } from '../utils/search.utils';
import { LONG_TIMEOUT, MEDIUM_TIMEOUT, SHORT_TIMEOUT, VERY_SHORT_TIMEOUT, sleep } from '../utils/timing.utils';

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

    await Pages.RevealSecrets.revealSecretsProtectedMask.click();

    await Pages.RevealSecrets.revealSecretsValue.waitForText(iComparePrivateKeys[key], SHORT_TIMEOUT);
  }
);

Given(/I'm waiting for 'success ✓' operation status/, { timeout: LONG_TIMEOUT }, async () => {
  await findElement(OperationStatusSelectors.successDoneOperation, undefined, LONG_TIMEOUT);

  await sleep(10_000); // TODO: Make optional
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

// for checking validation errors or other where is no 'type' property
Given(
  /I got the validation-error '(.*)' with (.*) element on the (.*) page/,
  { timeout: MEDIUM_TIMEOUT },
  async (errorName: string, elementName: string, pageName: string) => {
    await createPageElement(`${pageName}/${elementName}`).waitForDisplayed();
    const getErrorContent = await createPageElement(`${pageName}/${elementName}`).getText();

    expect(getErrorContent).eql(errorName);
  }
);

// For checking alert-type errors/warnings
Given(
  /I got the '(.*)' (warning|error) with (.*) element on the (.*) page/,
  { timeout: MEDIUM_TIMEOUT },
  async (errorName: string, type, elementName: string, pageName: string) => {
    await findElement(
      `${pageName}/${elementName}`,
      { type },
      VERY_SHORT_TIMEOUT,
      `Element with '${type}' type not found. It may be:
    1) Expected element has another type
    2) Element is not displayed`
    );

    const getErrorContent = await createPageElement(`${pageName}/${elementName}`).getText();

    expect(getErrorContent).eql(errorName);
  }
);
