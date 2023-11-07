import { Given } from '@cucumber/cucumber';
import axios from 'axios';

import { envVars } from 'e2e/src/utils/env.utils';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { iEnterValues, IEnterValuesKey } from '../utils/input-data.utils';
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
    await createPageElement(`${pageName}/${elementName}`).click();
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
  await Pages.SetWallet.analyticsCheckbox.click();
  await Pages.SetWallet.skipOnboarding.click();
  await Pages.SetWallet.acceptTerms.click();
  await Pages.SetWallet.importButton.click();

  await Pages.NewsletterModal.isVisible();
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

Given(/I make request for creating a notification/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const currentDate = new Date();
  const currentDateISO = new Date().toISOString();
  const expirationDateISO = new Date(currentDate.getTime() + 180000).toISOString(); // Notification will be deleted in 3 minutes

  const requestBody = {
    mobile: 'off',
    extension: 'on',
    type: 'News',
    title: 'Test Title',
    description: 'Test description',
    extensionImageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtIvsRFAUjlUKqlsLnrrJnWtcx98vOncHTXQ&usqp=CAU',
    mobileImageUrl: '',
    content: 'Test content',
    date: currentDateISO,
    expirationDate: expirationDateISO
  };

  const response = await axios.post('https://temple-api-mainnet.stage.madfish.xyz/api/notifications', requestBody, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: envVars.NOTIFICATION_AUTHORIZATION
    }
  });

  if (response.status !== 200)
    throw new Error(
      `Some problems with backend server. Server returns ${response.statusText} with ${response.status} status code`
    );
});
