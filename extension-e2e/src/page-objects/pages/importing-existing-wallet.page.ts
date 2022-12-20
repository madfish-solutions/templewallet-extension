import { ImportFromSeedPhraseTestIds } from '../../../../src/app/pages/NewWallet/import/ImportSeedPhrase/ImportFromSeedPhrase.test-ids';
import { Page } from '../../classes/page.class';
import { createPageElement, findElements } from '../../utils/search.utils';

export class ImportExistingWalletPage extends Page {
  nextButton = createPageElement(ImportFromSeedPhraseTestIds.nextButton);
  wordInput = createPageElement(ImportFromSeedPhraseTestIds.wordInput);

  async isVisible() {
    await this.nextButton.waitForDisplayed();
    await this.wordInput.waitForDisplayed();
  }
  async getWordsInputs() {
    return findElements(ImportFromSeedPhraseTestIds.wordInput);
  }
}
