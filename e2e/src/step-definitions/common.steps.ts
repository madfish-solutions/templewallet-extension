import { Given } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { getInputText } from '../utils/input.utils';
import { createPageElement } from '../utils/search.utils';
import { enterMyMnemonicStep } from '../utils/shared-steps.utils';
import { LONG_TIMEOUT } from '../utils/timing.utils';

Given(/^I am on the (\w+) page$/, async (page: keyof typeof Pages) => {
  await Pages[page].isVisible();
});

Given(/I press (.*) on the (.*) page/, async (elementName: string, pageName: string) => {
  await createPageElement(`${pageName}/${elementName}`).click();
});

Given(/I enter my mnemonic/, async () => {
  await enterMyMnemonicStep();
});

Given(
  /I enter (seed|password) into (.*) on the (.*) page/,
  async (inputType: string, elementName: string, pageName: string) => {
    const inputText = getInputText(inputType);

    await createPageElement(`${pageName}/${elementName}`).type(inputText);
  }
);

Given(/I have imported an existing account/, { timeout: LONG_TIMEOUT }, async () => {
  await Pages.Welcome.isVisible();
  await Pages.Welcome.importExistingWalletButton.click();

  await Pages.ImportExistingWallet.isVisible();
  await enterMyMnemonicStep();
  await Pages.ImportExistingWallet.nextButton.click();

  await Pages.SetWallet.isVisible();
  await Pages.SetWallet.passwordField.type(BrowserContext.password);
  await Pages.SetWallet.repeatPasswordField.type(BrowserContext.password);
  await Pages.SetWallet.skipOnboarding.click();
  await Pages.SetWallet.acceptTerms.click();
  await Pages.SetWallet.completeButton.click();

  await Pages.Header.isVisible();
});
