import { Given } from '@cucumber/cucumber';

import { Pages } from '../page-objects';
import { findElement } from '../utils/search.utils';

Given(/^I am on the (\w+) page$/, async (page: keyof typeof Pages) => {
  await Pages[page].isVisible();
});

Given(/I press (.*)/, async (buttonSelector: string) => {
  await (await findElement(buttonSelector)).click();
});
