import { AccountsTestData } from '../classes/accounts';
import { BrowserContext } from '../classes/browser-context.class';

export const getInputText = (inputType: AccountsTestData) => {
  let inputText = '';

  switch (inputType) {
    case AccountsTestData.defaultSeedPhrase:
      inputText = BrowserContext.seedPhrase;
      break;
    case AccountsTestData.defaultPassword:
      inputText = BrowserContext.password;
      break;
  }

  return inputText;
};

export const getPrivateKeyText = (compareType: AccountsTestData) => {
  let comparePrivateKey = '';

  switch (compareType) {
    case AccountsTestData.secondSeedPhrasePrivateKey:
      comparePrivateKey = BrowserContext.privateKeyOfSecondSeedPhrase;
      break;
    case AccountsTestData.CreatedOrRestoredAccountPrivateKey:
      comparePrivateKey = BrowserContext.privateKeyOfCreatedOrRestoredAccount;
      break;
  }

  return comparePrivateKey;
};
