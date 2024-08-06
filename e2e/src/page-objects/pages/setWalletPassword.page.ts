import { createPasswordSelectors } from 'src/app/templates/CreatePasswordForm/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class setWalletPage extends Page {
  passwordField = createPageElement(createPasswordSelectors.passwordField);
  repeatPasswordField = createPageElement(createPasswordSelectors.repeatPasswordField);
  analyticsCheckbox = createPageElement(createPasswordSelectors.analyticsCheckBox);
  importButton = createPageElement(createPasswordSelectors.importButton);
  createButton = createPageElement(createPasswordSelectors.createButton);

  async isVisible() {
    await this.passwordField.waitForDisplayed();
    await this.repeatPasswordField.waitForDisplayed();
    await this.analyticsCheckbox.waitForDisplayed();
    await this.createButton.waitForDisplayed();
  }
}
