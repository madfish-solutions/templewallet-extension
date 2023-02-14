import { ImportAccountTestIds } from '../../../../../src/app/pages/ImportAccount/ImportAccount.test-ids';
import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class ImportAccountPrivateKeyTab extends Page {
  privateKeyInput = createPageElement(ImportAccountTestIds.privateKeyInput);
  privateKeyImportButton = createPageElement(ImportAccountTestIds.privateKeyImportButton);

  async isVisible() {
    await this.privateKeyInput.waitForDisplayed();
    await this.privateKeyImportButton.waitForDisplayed();
  }
}
