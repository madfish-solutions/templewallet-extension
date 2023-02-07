import { AccountsTestData } from '../classes/accounts-test-data.class';
import { BrowserContext } from '../classes/browser-context.class';

export const getInputText = (inputType: AccountsTestData) => {
  switch (inputType) {
    case AccountsTestData.seedPhrase:
      return BrowserContext.seedPhrase;

    case AccountsTestData.password:
      return BrowserContext.password;

    case AccountsTestData.privateKeySecondSeed:
      return BrowserContext.privateKeyOfSecondSeedPhrase;

    case AccountsTestData.privateKeyCreatedAccountHD:
      return BrowserContext.privateKeyOfCreatedAccountHD;
  }
};
