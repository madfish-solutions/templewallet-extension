import { Given } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { iEnterValues, IEnterValuesKey } from '../utils/input-data.utils';
import { createPageElement } from '../utils/search.utils';
import { LONG_TIMEOUT, MEDIUM_TIMEOUT, SHORT_TIMEOUT, sleep } from '../utils/timing.utils';

Given(/^I am on the (\w+) page$/, { timeout: LONG_TIMEOUT }, async (page: keyof typeof Pages) => {
  await Pages[page].isVisible();
});

Given(/I press (.*) on the (.*) page/, { timeout: MEDIUM_TIMEOUT }, async (elementName: string, pageName: string) => {
  await createPageElement(`${pageName}/${elementName}`).click();
});

Given(
  /I clear (.*) value on the (.*) page/,
  { timeout: MEDIUM_TIMEOUT },
  async (elementName: string, pageName: string) => {
    await createPageElement(`${pageName}/${elementName}`).clearInput();
  }
);

Given(
  /I enter (.*) into (.*) on the (.*) page/,
  { timeout: SHORT_TIMEOUT },
  async (key: IEnterValuesKey, elementName: string, pageName: string) => {
    const inputText = iEnterValues[key];

    await createPageElement(`${pageName}/${elementName}`).type(inputText);
  }
);

Given(/I have imported an existing account/, { timeout: LONG_TIMEOUT }, async () => {
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

  await Pages.Home.NewsletterCloseButton.waitForDisplayed();
  await sleep(1000);
  await Pages.Home.NewsletterCloseButton.click();

  await Pages.Home.isVisible();
});
