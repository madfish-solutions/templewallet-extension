import { ImportSeedFormSelectors } from 'src/app/templates/ImportSeedForm/selectors';

import { Page } from '../../classes/page.class';
import { clearDataFromCurrentInput } from '../../utils/input-data.utils';
import { createPageElement, findElements } from '../../utils/search.utils';

export class ImportExistingWalletPage extends Page {
  nextButton = createPageElement(ImportSeedFormSelectors.nextButton);
  wordInput = createPageElement(ImportSeedFormSelectors.wordInput);

  async isVisible() {
    await this.nextButton.waitForDisplayed();
    await this.wordInput.waitForDisplayed();
  }

  async enterSeedPhrase(seedPhrase: string) {
    const wordsArray = seedPhrase.split(' ');
    const wordsInputs = await findElements(ImportSeedFormSelectors.wordInput);

    for (let i = 0; i < wordsArray.length; i++) {
      const word = wordsArray[i];
      const input = wordsInputs[i];

      await input.fill(word);
    }
  }

  async clearSeedPhrase() {
    const wordsInputs = await findElements(ImportSeedFormSelectors.wordInput);

    for (let i = 0; i < wordsInputs.length; i++) {
      const input = wordsInputs[i];

      await input.focus();
      await clearDataFromCurrentInput();
    }
  }
}
