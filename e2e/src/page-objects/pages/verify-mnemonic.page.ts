import { NewSeedVerifySelectors } from 'src/app/pages/NewWallet/create/NewSeedVerify/NewSeedVerify.selectors';

import { BrowserContext } from 'e2e/src/classes/browser-context.class';
import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElements, getElementText } from 'e2e/src/utils/search.utils';

export class VerifyMnemonicPage extends Page {
  nextButton = createPageElement(NewSeedVerifySelectors.nextButton);
  firstMnemonicInput = createPageElement(NewSeedVerifySelectors.mnemonicWordInput);

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

    const wordInputs = await findElements(NewSeedVerifySelectors.mnemonicWordInput);
    const wordInputTexts = await Promise.all(wordInputs.map(item => getElementText(item)));
    const emptyWordInputIndexes = wordInputTexts
      .map((text, index) => {
        if (text) return undefined;
        return index;
      })
      .filter(index => index !== undefined) as number[];

    const seedPhrase = BrowserContext.seedPhrase.split(' ');
    for (const index of emptyWordInputIndexes) {
      const input = wordInputs[index];

      const wordIndex = wordNumbers[index] - 1;
      const word = seedPhrase[wordIndex];

      await input.type(word);
    }
  }
}
