import { ImportAccountSelectors } from 'src/app/pages/ImportAccount/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class ImportAccountWatchOnlyTab extends Page {
  watchOnlyInput = createPageElement(ImportAccountSelectors.watchOnlyInput);
  watchOnlyImportButton = createPageElement(ImportAccountSelectors.watchOnlyImportButton);

  async isVisible() {
    await this.watchOnlyInput.waitForDisplayed();
    await this.watchOnlyImportButton.waitForDisplayed();
  }
}
