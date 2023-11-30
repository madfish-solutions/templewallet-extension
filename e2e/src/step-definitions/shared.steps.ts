import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';
import { ErrorCaptionSelectors } from 'src/app/atoms/ErrorCaption.selectors';
import { OperationStatusSelectors } from 'src/app/templates/OperationStatus.selectors';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';
import { iComparePrivateKeys } from '../utils/input-data.utils';
import { createPageElement, findElement, getElementText } from '../utils/search.utils';
import { LONG_TIMEOUT, MEDIUM_TIMEOUT, VERY_SHORT_TIMEOUT, sleep } from '../utils/timing.utils';

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

    const revealedText = await Pages.RevealSecrets.revealSecretsValue.getText();

    expect(revealedText).eql(iComparePrivateKeys[key]);
  }
);

Given(/I'm waiting for 'success ✓' operation status/, { timeout: LONG_TIMEOUT }, async () => {
  await findElement(OperationStatusSelectors.successDoneOperation, undefined, LONG_TIMEOUT);

  await sleep(10_000); // TODO: Make optional
});

const hashObjectShortForm = {
  defaultFirstAccountShortHash: envVars.DEFAULT_HD_ACCOUNT_FIRST_HASH_SHORT_FORM,
  defaultSecondAccountShortHash: envVars.DEFAULT_HD_ACCOUNT_SECOND_HASH_SHORT_FORM,
  importedAccountShortHash: envVars.IMPORTED_HD_ACCOUNT_FIRST_HASH_SHORT_FORM,
  importedAccountDerPathShortHash: 'tz1RPXf...RE8q',
  importedAccountByPasswordShortHash: 'tz1ZfC8...PcHE', // By additional (optional) 'Password' input
  watchOnlyAccountShortHash: envVars.WATCH_ONLY_PUBLIC_KEY_HASH_SHORT_FORM,
  longFirstAccountShortHash: envVars.LONG_HD_ACCOUNT_FIRST_HASH_SHORT_FORM
};

Given(
  /I check if (.*) is corresponded to the selected account/,
  { timeout: MEDIUM_TIMEOUT },
  async (hashType: keyof typeof hashObjectShortForm) => {
    const pkhFromUI = await Pages.Home.PublicAddressButton.getText();
    const targetPkh = hashObjectShortForm[hashType];

    expect(pkhFromUI).eql(targetPkh);
  }
);

// universal assertion check
Given(
  /The (.*) on the (.*) page has correct (.*) value/,
  { timeout: MEDIUM_TIMEOUT },
  async (elementName: string, pageName: string, value: string) => {
    const elementValue = await createPageElement(`${pageName}/${elementName}`).getText();

    expect(elementValue).eql(value);
  }
);

Given(
  /The (.*) is displayed on the (.*) page/,
  { timeout: MEDIUM_TIMEOUT },
  async (elementName: string, pageName: string) => {
    await createPageElement(`${pageName}/${elementName}`).waitForDisplayed();
  }
);

// for checking validation errors or other where is no 'type' property
Given(
  /I got the validation-error '(.*)' with (.*) element on the (.*) page/,
  { timeout: MEDIUM_TIMEOUT },
  async (errorName: string, elementName: string, pageName: string) => {
    const getErrorContent = await createPageElement(`${pageName}/${elementName}`).getText();

    expect(getErrorContent).eql(errorName);
  }
);

// for checking validation errors where is no 'type' property for related input/checkbox component

Given(
  /I got the validation-error '(.*)' in the (.*) on the (.*) page/,
  { timeout: MEDIUM_TIMEOUT },
  async (errorName: string, parentElementName: string, pageName: string) => {
    const childElement = await createPageElement(`${pageName}/${parentElementName}`)
      .createChildElement(ErrorCaptionSelectors.inputError)
      .findElement();
    const getErrorContent = await getElementText(childElement);
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
