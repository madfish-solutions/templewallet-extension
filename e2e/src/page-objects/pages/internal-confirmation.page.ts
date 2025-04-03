import { OperationsBannerSelectors } from 'src/app/icons/OperationsBanner/OperationsBanner.selectors';
import { InternalConfirmationSelectors } from 'src/app/templates/InternalConfirmation.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class InternalConfirmationPage extends Page {
  confirmButton = createPageElement(InternalConfirmationSelectors.confirmButton);
  declineButton = createPageElement(InternalConfirmationSelectors.declineButton);
  bytesTab = createPageElement(InternalConfirmationSelectors.bytesTab);
  rawTab = createPageElement(InternalConfirmationSelectors.rawTab);
  previewTab = createPageElement(InternalConfirmationSelectors.previewTab);
  retryButton = createPageElement(InternalConfirmationSelectors.retryButton);
  errorText = createPageElement(OperationsBannerSelectors.errorText);
  errorDropDownButton = createPageElement(OperationsBannerSelectors.errorDropDownButton);
  errorValue = createPageElement(OperationsBannerSelectors.errorValue);

  async isVisible() {
    try {
      await this.errorText.waitForDisplayed();
      await this.errorDropDownButton.click();

      const errorLog = await this.errorValue.getText();
      console.log('Confirmation page includes error logs:', errorLog);
    } catch (error) {
      await this.confirmButton.waitForDisplayed();
      await this.declineButton.waitForDisplayed();
      await this.bytesTab.waitForDisplayed();
      await this.rawTab.waitForDisplayed();
      await this.previewTab.waitForDisplayed();
    }
  }
}
