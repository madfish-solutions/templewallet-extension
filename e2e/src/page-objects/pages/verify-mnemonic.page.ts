import { NewSeedVerifyTestIds } from '../../../../src/app/pages/NewWallet/create/NewSeedVerify/NewSeedVerify.test-ids';
import { Page } from '../../classes/page.class';
import { createPageElement, findElements } from '../../utils/search.utils';

export class VerifyMnemonicPage extends Page {
  nextButton = createPageElement(NewSeedVerifyTestIds.nextButton);
  firstMnemonicInput = createPageElement(NewSeedVerifyTestIds.firstMnemonicInput);

  async isVisible() {
    await this.nextButton.waitForDisplayed();
    await this.firstMnemonicInput.waitForDisplayed();
  }
  async getWordNumberSpans() {
    return findElements(NewSeedVerifyTestIds.mnemonicWordNumber);
  }
  async getWordsInputs() {
    return findElements(NewSeedVerifyTestIds.firstMnemonicInput);
  }
}
