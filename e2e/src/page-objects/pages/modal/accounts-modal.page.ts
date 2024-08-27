import { AccountsModalSelectors } from 'src/app/templates/AppHeader/selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class AccountsModalPage extends Page {
  searchField = createPageElement(AccountsModalSelectors.searchField);
  accountsManagementButton = createPageElement(AccountsModalSelectors.accountsManagementButton);
  newWalletActionsButton = createPageElement(AccountsModalSelectors.newWalletActionsButton);
  cancelButton = createPageElement(AccountsModalSelectors.cancelButton);

  async isVisible() {
    await this.searchField.waitForDisplayed();
    await this.accountsManagementButton.waitForDisplayed();
    await this.newWalletActionsButton.waitForDisplayed();
    await this.cancelButton.waitForDisplayed();
  }
}
