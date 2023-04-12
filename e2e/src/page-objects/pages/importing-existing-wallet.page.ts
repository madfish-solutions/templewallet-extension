import { ImportFromSeedPhraseSelectors } from 'src/app/pages/NewWallet/import/ImportSeedPhrase/ImportFromSeedPhrase.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement, findElements } from '../../utils/search.utils';

export class ImportExistingWalletPage extends Page {
  nextButton = createPageElement(ImportFromSeedPhraseSelectors.nextButton);
  wordInput = createPageElement(ImportFromSeedPhraseSelectors.wordInput);

  async isVisible() {
    await this.nextButton.waitForDisplayed();
    await this.wordInput.waitForDisplayed();
  }

  async enterSeedPhrase(seedPhrase: string) {
    const wordsArray = seedPhrase.split(' ');
    const wordsInputs = await findElements(ImportFromSeedPhraseSelectors.wordInput);

    for (let i = 0; i < wordsArray.length; i++) {
      const word = wordsArray[i];
      const input = wordsInputs[i];

      await input.type(word);
    }
  }
}
