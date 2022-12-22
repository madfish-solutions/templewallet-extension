import { Given } from '@cucumber/cucumber';

import { Pages } from '../page-objects';
import { getInputText } from '../utils/input.utils';
import { createPageElement } from '../utils/search.utils';
import { enterMyMnemonicStep } from '../utils/shared-steps.utils';

Given(/^I am on the (\w+) page$/, async (page: keyof typeof Pages) => {
  await Pages[page].isVisible();
});

Given(/I press (.*) on the (.*) page/, async (elementName: string, pageName: string) => {
  await createPageElement(`${pageName}/${elementName}`).click();
});

Given(/I enter my mnemonic/, async () => {
  await enterMyMnemonicStep();
});

Given(
  /I enter (seed|password) into (.*) on the (.*) page/,
  async (inputType: string, elementName: string, pageName: string) => {
    const inputText = getInputText(inputType);

    await createPageElement(`${pageName}/${elementName}`).type(inputText);
  }
);
