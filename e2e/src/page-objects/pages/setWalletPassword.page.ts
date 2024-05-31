import { setWalletPasswordSelectors } from 'src/app/pages/NewWallet/setWalletPassword/SetWalletPassword.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class setWalletPage extends Page {
  passwordField = createPageElement(setWalletPasswordSelectors.passwordField);
  repeatPasswordField = createPageElement(setWalletPasswordSelectors.repeatPasswordField);
  analyticsCheckbox = createPageElement(setWalletPasswordSelectors.analyticsCheckBox);
  skipOnboarding = createPageElement(setWalletPasswordSelectors.skipOnboardingCheckbox);
  acceptTerms = createPageElement(setWalletPasswordSelectors.acceptTermsCheckbox);
  importButton = createPageElement(setWalletPasswordSelectors.importButton);

  async isVisible() {
    await this.passwordField.waitForDisplayed();
    await this.repeatPasswordField.waitForDisplayed();
    await this.analyticsCheckbox.waitForDisplayed();
    await this.skipOnboarding.waitForDisplayed();
    await this.acceptTerms.waitForDisplayed();
  }
}
