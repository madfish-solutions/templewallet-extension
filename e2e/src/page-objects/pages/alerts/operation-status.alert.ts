import { OperationStatusSelectors } from 'src/app/templates/OperationStatus.selectors';
import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class OperationStatusAlert extends Page {
  successEstimatedOperation = createPageElement(OperationStatusSelectors.successEstimatedOperation);

  async isVisible() {
    await this.successEstimatedOperation.waitForDisplayed();
  }
}
