import { CreateAccountSelectors } from 'src/app/pages/CreateAccount/CreateAccount.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class CreateOrRestoreAnAccountPage extends Page {
  accountNameInputField = createPageElement(CreateAccountSelectors.accountNameInputField);
  createOrRestoreButton = createPageElement(CreateAccountSelectors.createOrRestoreButton);

  async isVisible() {
    await this.accountNameInputField.waitForDisplayed();
    await this.createOrRestoreButton.waitForDisplayed();
  }
}
