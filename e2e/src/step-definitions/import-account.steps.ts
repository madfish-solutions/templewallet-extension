import { Given } from '@cucumber/cucumber';

import { BrowserContext } from '../classes/browser-context.class';
import { Pages } from '../page-objects';

Given(/I enter second mnemonic/, async () => {
  await Pages.ImportAccountMnemonic.enterSeedPhrase(BrowserContext.importedSeedPhrase);
});

Given(/I select (.*) tab/, async (tabName: string) => {
  await Pages.ImportAccountTab.selectTab(tabName);
});
