import { ImportAccountSelectors } from 'src/app/pages/ImportAccount/ImportAccount.selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class ImportAccountPrivateKeyTab extends Page {
  privateKeyInput = createPageElement(ImportAccountSelectors.privateKeyInput);
  privateKeyImportButton = createPageElement(ImportAccountSelectors.privateKeyImportButton);

  async isVisible() {
    await this.privateKeyInput.waitForDisplayed();
    await this.privateKeyImportButton.waitForDisplayed();
  }
}
