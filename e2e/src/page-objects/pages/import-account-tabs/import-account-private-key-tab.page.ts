import { ImportAccountSelectors } from 'src/app/pages/ImportAccount/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class ImportAccountPrivateKeyTab extends Page {
  privateKeyInput = createPageElement(ImportAccountSelectors.privateKeyInput);
  privateKeyImportButton = createPageElement(ImportAccountSelectors.privateKeyImportButton);

  async isVisible() {
    await this.privateKeyInput.waitForDisplayed();
    await this.privateKeyImportButton.waitForDisplayed();
  }
}
