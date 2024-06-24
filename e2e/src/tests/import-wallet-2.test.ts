import { test } from '../fixtures/extension';
import { describeScenario } from '../hooks';
import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';

describeScenario('Import Wallet', () => {
  test('Entering seed phrase', async () => {
    await Pages.Welcome.importExistingWalletButton.waitForDisplayed();
    await Pages.Welcome.importExistingWalletButton.click();
    await Pages.ImportExistingWallet.enterSeedPhrase(envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE);
    await Pages.ImportExistingWallet.nextButton.click();
  });

  test('Setting password', async () => {
    await Pages.SetWallet.passwordField.fill(envVars.DEFAULT_PASSWORD);
    await Pages.SetWallet.repeatPasswordField.fill(envVars.DEFAULT_PASSWORD);
    await Pages.SetWallet.acceptTerms.click();
    await Pages.SetWallet.importButton.click();
  });

  test('Closing overlays', async () => {
    // await Pages.SetWallet.skipOnboarding.click();
    await Pages.NewsletterModal.closeButton.click();
  });
});
