import { WelcomeTestIds } from '../../../../src/app/pages/Welcome/Welcome.test-ids';
import { createPageElement } from '../../utils/search.utils';
import { Page } from '../page.class';

export class WelcomePage extends Page {
  createNewWalletButton = createPageElement(WelcomeTestIds.createNewWallet);
  importExistingWalletButton = createPageElement(WelcomeTestIds.importExistingWallet);

  async isVisible() {
    await this.createNewWalletButton.waitForDisplayed();
    await this.importExistingWalletButton.waitForDisplayed();
  }
}
