import { DelegateFormSelectors } from 'src/app/templates/DelegateForm.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class DelegateFormPage extends Page {
  bakerDelegateButton = createPageElement(DelegateFormSelectors.bakerDelegateButton);
  bakerInput = createPageElement(DelegateFormSelectors.bakerInput);

  async isVisible() {
    await this.bakerInput.waitForDisplayed();
  }
}
