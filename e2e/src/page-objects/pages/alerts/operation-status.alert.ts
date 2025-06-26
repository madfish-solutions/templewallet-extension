import { OperationStatusSelectors } from 'src/app/templates/OperationStatus.selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class OperationStatusAlert extends Page {
  successEstimatedOperation = createPageElement(OperationStatusSelectors.successEstimatedOperation);

  async isVisible() {
    await this.successEstimatedOperation.waitForDisplayed();
  }
}
