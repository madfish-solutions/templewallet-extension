import { AlertSelectors } from 'src/app/atoms/Alert.selectors';
import { UnlockSelectors } from 'src/app/pages/Unlock/Unlock.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class UnlockScreenPage extends Page {
  passwordInput = createPageElement(UnlockSelectors.passwordInput);
  unlockButton = createPageElement(UnlockSelectors.unlockButton);
  importWalletUsingSeedPhrase = createPageElement(UnlockSelectors.importWalletUsingSeedPhrase);
  alertTitle = createPageElement(AlertSelectors.alertTitle);

  async isVisible() {
    await this.passwordInput.waitForDisplayed();
    await this.unlockButton.waitForDisplayed();
    await this.importWalletUsingSeedPhrase.waitForDisplayed();
  }
}
