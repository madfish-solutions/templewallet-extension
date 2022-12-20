import { Given } from '@cucumber/cucumber';

import { Pages } from '../page-objects';
import { createPageElement } from '../utils/search.utils';

Given(/^I am on the (\w+) page$/, async (page: keyof typeof Pages) => {
  await Pages[page].isVisible();
});

Given(/I press (.*) on the (.*) the page/, async (elementName: string, pageName: string) => {
  await createPageElement(`${pageName}/${elementName}`).click();
});
