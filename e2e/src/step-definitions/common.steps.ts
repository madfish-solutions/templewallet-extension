import { Given } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';
import { testDataForInput } from '../classes/test-data-for-input.class';
import { Pages } from '../page-objects';
import { createPageElement } from '../utils/search.utils';
import { TWENTY_SECONDS_TIMEOUT, THIRTY_SECONDS_TIMEOUT } from '../utils/timing.utils';

Given(/^I am on the (\w+) page$/, { timeout: THIRTY_SECONDS_TIMEOUT }, async (page: keyof typeof Pages) => {
  await Pages[page].isVisible();
});

Given(/I press (.*) on the (.*) page/, async (elementName: string, pageName: string) => {
  await createPageElement(`${pageName}/${elementName}`).click();
});

Given(
  /I enter (.*) into (.*) on the (.*) page/,
  async (inputType: keyof typeof testDataForInput, elementName: string, pageName: string) => {
    const inputText = testDataForInput[inputType];

    await createPageElement(`${pageName}/${elementName}`).type(inputText);
  }
);

Given(/I have imported an existing account/, { timeout: TWENTY_SECONDS_TIMEOUT }, async () => {
  await Pages.Welcome.isVisible();
  await Pages.Welcome.importExistingWalletButton.click();

  await Pages.ImportExistingWallet.isVisible();
  await Pages.ImportExistingWallet.enterSeedPhrase(BrowserContext.seedPhrase);
  await Pages.ImportExistingWallet.nextButton.click();

  await Pages.SetWallet.isVisible();
  await Pages.SetWallet.passwordField.type(BrowserContext.password);
  await Pages.SetWallet.repeatPasswordField.type(BrowserContext.password);
  await Pages.SetWallet.skipOnboarding.click();
  await Pages.SetWallet.acceptTerms.click();
  await Pages.SetWallet.importButton.click();

  await Pages.Home.isVisible();
});
