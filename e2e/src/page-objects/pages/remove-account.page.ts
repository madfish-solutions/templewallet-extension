import { AlertSelectors } from 'src/app/atoms/Alert.selectors';
import { RemoveAccountSelectors } from 'src/app/templates/RemoveAccount/RemoveAccount.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class RemoveAccountPage extends Page {
  passwordInput = createPageElement(RemoveAccountSelectors.passwordInput);
  removeButton = createPageElement(RemoveAccountSelectors.removeButton);
  alertWarning = createPageElement(AlertSelectors.alertTitle);

  async isVisible() {
    try {
      await this.alertWarning.waitForDisplayed(5000);
    } catch (error) {
      await this.removeButton.waitForDisplayed();
      await this.passwordInput.waitForDisplayed();
    }
  }
}
