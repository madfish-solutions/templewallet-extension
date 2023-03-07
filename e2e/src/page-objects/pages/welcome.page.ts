import { WelcomeSelectors } from '../../../../src/app/pages/Welcome/Welcome.selectors';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class WelcomePage extends Page {
  createNewWalletButton = createPageElement(WelcomeSelectors.createNewWallet);
  importExistingWalletButton = createPageElement(WelcomeSelectors.importExistingWallet);

  async isVisible() {
    await this.createNewWalletButton.waitForDisplayed();
    await this.importExistingWalletButton.waitForDisplayed();
  }
}
