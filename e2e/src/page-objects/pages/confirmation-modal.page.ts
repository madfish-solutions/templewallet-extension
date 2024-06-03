import { ConfirmatonModalSelectors } from 'src/app/templates/ConfirmationModal/ConfirmatonModal.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class ConfirmationModalPage extends Page {
  okButton = createPageElement(ConfirmatonModalSelectors.okButton);
  cancelButton = createPageElement(ConfirmatonModalSelectors.cancelButton);

  async isVisible() {
    await this.okButton.waitForDisplayed();
    await this.cancelButton.waitForDisplayed();
  }
}
