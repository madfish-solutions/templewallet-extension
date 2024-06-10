import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';
import { switchToPage } from '../utils/shared.utils';

export async function ImportExistingWallet(): Promise<void> {
  await switchToPage('chrome-extension://');

  await Pages.Welcome.importExistingWalletButton.waitForDisplayed();
  await Pages.Welcome.importExistingWalletButton.click();
  await Pages.ImportExistingWallet.enterSeedPhrase(envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE);
  await Pages.ImportExistingWallet.nextButton.click();
  await Pages.SetWallet.passwordField.fill(envVars.DEFAULT_PASSWORD);
  await Pages.SetWallet.repeatPasswordField.fill(envVars.DEFAULT_PASSWORD);
  await Pages.SetWallet.skipOnboarding.click();
  await Pages.SetWallet.acceptTerms.click();
  await Pages.SetWallet.importButton.click();
  await Pages.NewsletterModal.closeButton.click();
}
