import { AfterAll } from '@cucumber/cucumber';

import { CustomBrowserContext } from '../../../e2e-tests/src/classes/browser-context.class';

AfterAll(async () => {
  await CustomBrowserContext.browser.close();
});
