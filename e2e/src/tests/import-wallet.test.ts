import { test } from '../fixtures/extension';
import { describeScenario } from '../fixtures/hooks';
import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';

describeScenario('Import Wallet', () => {
  test('Import Wallet: positive scenario', async () => {
    await Pages.Welcome.importExistingWalletButton.waitForDisplayed();
    await Pages.Welcome.importExistingWalletButton.click();
    await Pages.ImportExistingWallet.enterSeedPhrase(envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE);
    await Pages.ImportExistingWallet.nextButton.click();

    await Pages.SetWallet.passwordField.fill(envVars.DEFAULT_PASSWORD);
    await Pages.SetWallet.repeatPasswordField.fill(envVars.DEFAULT_PASSWORD);
    await Pages.SetWallet.importButton.click();

    // await Pages.NewsletterModal.closeButton.click();
    await Pages.Home.isVisible();
  });
});
