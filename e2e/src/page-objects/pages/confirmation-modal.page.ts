import { ConfirmatonModalSelectors } from 'src/app/templates/ConfirmationModal/ConfirmatonModal.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class ConfirmationModalPage extends Page {
  okButton = createPageElement(ConfirmatonModalSelectors.okButton);
  cancelButton = createPageElement(ConfirmatonModalSelectors.cancelButton);

  async isVisible() {
    await this.okButton.waitForDisplayed();
    await this.cancelButton.waitForDisplayed();
  }
}
