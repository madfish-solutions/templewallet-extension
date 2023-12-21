import { Given } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { iEnterValues, IEnterValuesKey, clearDataFromCurrentInput } from '../utils/input-data.utils';
import { createPageElement } from '../utils/search.utils';
import { LONG_TIMEOUT, MEDIUM_TIMEOUT, SHORT_TIMEOUT } from '../utils/timing.utils';

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
    const element = createPageElement(`${pageName}/${elementName}`);
    await element.click();
    await clearDataFromCurrentInput();
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
  await Pages.SetWallet.analyticsCheckbox.click();
  await Pages.SetWallet.skipOnboarding.click();
  await Pages.SetWallet.acceptTerms.click();
  await Pages.SetWallet.importButton.click();

  await Pages.NewsletterModal.isVisible(LONG_TIMEOUT);
  await Pages.NewsletterModal.closeButton.click();

  await Pages.Home.isVisible();
});

Given(
  /^I scroll (.*) pixels on the (\w+) page$/,
  { timeout: MEDIUM_TIMEOUT },
  async (countOfScroll: number, page: keyof typeof Pages) => {
    await Pages[page].scrollTo(countOfScroll);
  }
);

Given(/I reload the page/, async () => {
  await BrowserContext.page.reload();
});
