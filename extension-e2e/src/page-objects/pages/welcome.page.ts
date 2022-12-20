import { WelcomeTestIds } from '../../../../src/app/pages/Welcome/Welcome.test-ids';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class WelcomePage extends Page {
  createNewWalletButton = createPageElement(WelcomeTestIds.createNewWallet);
  importExistingWalletButton = createPageElement(WelcomeTestIds.importExistingWallet);

  async isVisible() {
    await this.createNewWalletButton.waitForDisplayed();
    await this.importExistingWalletButton.waitForDisplayed();
  }
}
