import { DelegateFormSelectors } from '../../../../src/app/templates/DelegateForm.selectors';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class DelegateFormPage extends Page {
  knownBakerItemDelegateAButton = createPageElement(DelegateFormSelectors.knownBakerItemDelegateAButton);
  knownBakerItemDelegateBButton = createPageElement(DelegateFormSelectors.knownBakerItemBButton);
  unknownBakerDelegateButton = createPageElement(DelegateFormSelectors.unknownBakerDelegateButton);
  bakerInput = createPageElement(DelegateFormSelectors.bakerInput);

  async isVisible() {
    await this.bakerInput.waitForDisplayed();
  }
}
