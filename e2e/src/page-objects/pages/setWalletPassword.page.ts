import { setWalletPasswordTestIDS } from '../../../../src/app/pages/NewWallet/setWalletPassword/SetWalletPassword.test-ids';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class setWalletPage extends Page {
  passwordField = createPageElement(setWalletPasswordTestIDS.passwordField);
  repeatPasswordField = createPageElement(setWalletPasswordTestIDS.repeatPasswordField);
  skipOnboarding = createPageElement(setWalletPasswordTestIDS.skipOnboardingCheckbox);
  acceptTerms = createPageElement(setWalletPasswordTestIDS.acceptTermsCheckbox);
  importButton = createPageElement(setWalletPasswordTestIDS.importButton);

  async isVisible() {
    await this.passwordField.waitForDisplayed();
    await this.repeatPasswordField.waitForDisplayed();
    await this.skipOnboarding.waitForDisplayed();
    await this.acceptTerms.waitForDisplayed();
  }
}
