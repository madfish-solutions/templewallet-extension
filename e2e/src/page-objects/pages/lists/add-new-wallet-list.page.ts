import { NewWalletActionsPopperSelectors } from 'src/app/templates/NewWalletActionsPopper/selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class AddNewWalletListPage extends Page {
  createWallet = createPageElement(NewWalletActionsPopperSelectors.createWallet);
  importWallet = createPageElement(NewWalletActionsPopperSelectors.importWallet);
  ledgerConnect = createPageElement(NewWalletActionsPopperSelectors.ledgerConnect);
  watchOnlyAccount = createPageElement(NewWalletActionsPopperSelectors.watchOnlyAccount);

  async isVisible() {
    await this.createWallet.waitForDisplayed();
    await this.importWallet.waitForDisplayed();
    await this.ledgerConnect.waitForDisplayed();
    await this.watchOnlyAccount.waitForDisplayed();
  }
}
