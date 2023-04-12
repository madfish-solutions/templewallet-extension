import { NewSeedVerifySelectors } from 'src/app/pages/NewWallet/create/NewSeedVerify/NewSeedVerify.selectors';

import { BrowserContext } from '../../classes/browser-context.class';
import { Page } from '../../classes/page.class';
import { createPageElement, findElements, getElementText } from '../../utils/search.utils';

export class VerifyMnemonicPage extends Page {
  nextButton = createPageElement(NewSeedVerifySelectors.nextButton);
  firstMnemonicInput = createPageElement(NewSeedVerifySelectors.firstMnemonicInput);

  async isVisible() {
    await this.nextButton.waitForDisplayed();
    await this.firstMnemonicInput.waitForDisplayed();
  }

  async enterSeedPhraseVerification() {
    const wordNumberSpans = await findElements(NewSeedVerifySelectors.mnemonicWordNumber);
    const wordNumberTexts = await Promise.all(wordNumberSpans.map(item => getElementText(item)));

    const wordNumbers = wordNumberTexts.map(fullText => {
      const numberText = fullText.split(' ')[1];

      return Number(numberText);
    });

    const wordInputs = await findElements(NewSeedVerifySelectors.firstMnemonicInput);
    const wordInputTexts = await Promise.all(wordInputs.map(item => getElementText(item)));
    const emptyWordInputIndexes = wordInputTexts
      .map((text, index) => {
        if (text) return undefined;
        return index;
      })
      .filter(index => index !== undefined) as number[];

    for (const index of emptyWordInputIndexes) {
      const input = wordInputs[index];

      const wordIndex = wordNumbers[index] - 1;
      const word = BrowserContext.seedPhrase.split(' ')[wordIndex];

      await input.type(word);
    }
  }
}
