import { RemoveAccountSelectors } from 'src/app/templates/RemoveAccount/RemoveAccount.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class RemoveAccountPage extends Page {
  passwordInput = createPageElement(RemoveAccountSelectors.passwordInput);
  removeButton = createPageElement(RemoveAccountSelectors.removeButton);

  async isVisible() {
    await this.passwordInput.waitForDisplayed();
    await this.removeButton.waitForDisplayed();
  }
}
