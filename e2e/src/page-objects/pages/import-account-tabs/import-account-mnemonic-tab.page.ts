import { ImportAccountSelectors } from 'src/app/pages/ImportAccount/ImportAccount.selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement, findElements } from '../../../utils/search.utils';

export class ImportAccountMnemonicTab extends Page {
  mnemonicWordInput = createPageElement(ImportAccountSelectors.mnemonicWordInput);
  mnemonicPasswordField = createPageElement(ImportAccountSelectors.mnemonicPasswordInput);
  mnemonicImportButton = createPageElement(ImportAccountSelectors.mnemonicImportButton);

  async isVisible() {
    await this.mnemonicWordInput.waitForDisplayed();
    await this.mnemonicPasswordField.waitForDisplayed();
    await this.mnemonicImportButton.waitForDisplayed();
  }

  async enterSeedPhrase(seedPhrase: string) {
    const wordsArray = seedPhrase.split(' ');
    const wordsInputs = await findElements(ImportAccountSelectors.mnemonicWordInput);

    for (let i = 0; i < wordsArray.length; i++) {
      const word = wordsArray[i];
      const input = wordsInputs[i];

      await input.type(word);
    }
  }
}
