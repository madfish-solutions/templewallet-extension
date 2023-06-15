import { OperationsBannerSelectors } from 'src/app/templates/OperationsBanner/OperationsBanner.selectors';

import { LONG_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { InternalConfirmationSelectors } from '../../../../src/app/templates/InternalConfirmation.selectors';
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
    await this.confirmButton.waitForDisplayed(LONG_TIMEOUT);
    await this.declineButton.waitForDisplayed();
    await this.bytesTab.waitForDisplayed();
    await this.rawTab.waitForDisplayed();
    await this.previewTab.waitForDisplayed();
  }

  async isErrorDisplayed() {
    try {
      await this.errorText.waitForDisplayed(5000);
      await this.errorDropDownButton.click();

      const errorLog = await this.errorValue.getText();
      console.log('ERROR is  ', errorLog);
    } catch (error) {
      await this.isVisible();
    }
  }
}
