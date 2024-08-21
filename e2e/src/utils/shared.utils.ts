import { CustomBrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

import { envVars } from './env.utils';

export const switchToPage = async (pageUrl: string) => {
  const pages = CustomBrowserContext.browser.pages();

  for (const page of pages) {
    if (page.url().startsWith(pageUrl)) {
      await page.bringToFront();

      return (CustomBrowserContext.page = page);
    }
  }
};

export const importWalletPrecondition = async () => {
  await Pages.Welcome.importExistingWalletButton.waitForDisplayed();
  await Pages.Welcome.importExistingWalletButton.click();
  await Pages.ImportExistingWallet.enterSeedPhrase(envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE);
  await Pages.ImportExistingWallet.nextButton.click();

  await Pages.SetWallet.passwordField.fill(envVars.DEFAULT_PASSWORD);
  await Pages.SetWallet.repeatPasswordField.fill(envVars.DEFAULT_PASSWORD);
  await Pages.SetWallet.acceptTerms.click();
  await Pages.SetWallet.importButton.click();

  await Pages.NewsletterModal.closeButton.click();
};
