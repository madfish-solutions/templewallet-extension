import { Given } from '@cucumber/cucumber';

import { iEnterValues } from 'e2e/src/utils/input-data.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';

type mnemonicPage = 'ImportAccountMnemonic' | 'ImportExistingWallet';

Given(
  /I enter (.*) mnemonic on the (\w+) page/,
  { timeout: MEDIUM_TIMEOUT },
  async (mnemonic: keyof typeof iEnterValues, page: mnemonicPage) => {
    const wrongMnemonic = iEnterValues[mnemonic];
    if (wrongMnemonic === undefined) throw new Error(`${mnemonic} key doesn't exist in the 'iEnterValues' object`);

    await Pages[page].enterSeedPhrase(wrongMnemonic);
  }
);

Given(/I clear entered mnemonic on the (\w+) page/, { timeout: MEDIUM_TIMEOUT }, async (page: mnemonicPage) => {
  await Pages[page].clearSeedPhrase();
});

Given(/I select (.*) tab/, async (tabName: string) => {
  await Pages.ImportAccountTab.selectTab(tabName);
});

Given(/I select mnemonic with (.*) words/, { timeout: MEDIUM_TIMEOUT }, async (wordsCount: string) => {
  await Pages.ImportAccountMnemonic.selectMnemonicWordsCount(wordsCount);
});
