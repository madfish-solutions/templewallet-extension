import { ImportAccountTestIds } from '../../../../../src/app/pages/ImportAccount/ImportAccount.test-ids';
import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class ImportAccountWatchOnlyTab extends Page {
  watchOnlyInput = createPageElement(ImportAccountTestIds.watchOnlyInput);
  watchOnlyImportButton = createPageElement(ImportAccountTestIds.watchOnlyImportButton);

  async isVisible() {
    await this.watchOnlyInput.waitForDisplayed();
    await this.watchOnlyImportButton.waitForDisplayed();
  }
}
