import { ImportAccountSelectors } from 'src/app/pages/ImportAccount/selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement, findElements } from '../../../utils/search.utils';

export class ImportAccountMnemonicTab extends Page {
  walletFromMnemonicWordInput = createPageElement(ImportAccountSelectors.walletFromMnemonicWordInput);
  walletFromMnemonicImportButton = createPageElement(ImportAccountSelectors.walletFromMnemonicImportButton);

  async isVisible() {
    await this.walletFromMnemonicWordInput.waitForDisplayed();
    await this.walletFromMnemonicImportButton.waitForDisplayed();
  }

  async enterSeedPhrase(seedPhrase: string) {
    const wordsArray = seedPhrase.split(' ');
    const wordsInputs = await findElements(ImportAccountSelectors.walletFromMnemonicWordInput);

    for (let i = 0; i < wordsArray.length; i++) {
      const word = wordsArray[i];
      const input = wordsInputs[i];

      await input.fill(word);
    }
  }
}
