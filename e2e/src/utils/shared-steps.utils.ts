import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

export const enterMyMnemonicStep = async () => {
  const wordsArray = BrowserContext.seedPhrase.split(' ');
  const wordsInputs = await Pages.ImportExistingWallet.getWordsInputs();

  for (let i = 0; i < wordsArray.length; i++) {
    const word = wordsArray[i];
    const input = wordsInputs[i];

    await input.type(word);
  }
};
