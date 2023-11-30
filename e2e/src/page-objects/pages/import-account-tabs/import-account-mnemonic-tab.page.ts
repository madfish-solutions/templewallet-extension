import { ImportAccountSelectors } from 'src/app/pages/ImportAccount/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { EMPTY_WORD_FOR_INPUTS, clearDataFromCurrentInput } from 'e2e/src/utils/input-data.utils';
import { createPageElement, findElement, findElements } from 'e2e/src/utils/search.utils';
import { SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

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

      await input.type(word.replace(EMPTY_WORD_FOR_INPUTS, ''));
    }
  }

  async clearSeedPhrase() {
    const wordsInputs = await findElements(ImportAccountSelectors.mnemonicWordInput);

    for (let i = 0; i < wordsInputs.length; i++) {
      const input = wordsInputs[i];

      await input.focus();
      await clearDataFromCurrentInput();
    }
  }

  async selectMnemonicWordsCount(words: string) {
    const mnemonicWordsCount = await findElement(
      ImportAccountSelectors.mnemonicWordsRadioButton,
      { words },
      SHORT_TIMEOUT,
      `Variant of Seed Phrase with ${words} words is not found:
      1) Selected variant is not displayed (bug/issue)
      2) Seed phrase can contain only 12, 15, 18, 21, 24 words`
    );

    await mnemonicWordsCount.click();
  }
}
