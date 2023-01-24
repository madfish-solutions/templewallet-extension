import { Given } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';
import { getElementText } from '../utils/search.utils';

Given(/I save my mnemonic/, async () => {
  const value = await Pages.NewSeedBackup.seedPhraseValue.getText();
  if (!value) throw new Error("Couldn't read mnemonic");
  BrowserContext.seedPhrase = value;
});

Given(/I verify my mnemonic/, async () => {
  const wordNumberSpans = await Pages.VerifyMnemonic.getWordNumberSpans();
  const wordNumberTexts = await Promise.all(wordNumberSpans.map(item => getElementText(item)));

  const wordNumbers = wordNumberTexts.map(fullText => {
    const numberText = fullText.split(' ')[1];

    return Number(numberText);
  });

  const wordInputs = await Pages.VerifyMnemonic.getWordsInputs();
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
});
