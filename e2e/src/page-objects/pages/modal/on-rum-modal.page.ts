import { OnRampOverlaySelectors } from 'src/app/layouts/PageLayout/OnRampOverlay/OnRampOverlay.selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class OnRumModalPage extends Page {
  closeButton = createPageElement(OnRampOverlaySelectors.closeButton);
  fiftyDollarButton = createPageElement(OnRampOverlaySelectors.fiftyDollarButton);
  oneHundredDollarButton = createPageElement(OnRampOverlaySelectors.oneHundredDollarButton);
  twoHundredDollarButton = createPageElement(OnRampOverlaySelectors.twoHundredDollarButton);
  customAmountButton = createPageElement(OnRampOverlaySelectors.customAmountButton);

  async isVisible() {
    await this.closeButton.waitForDisplayed();
    await this.fiftyDollarButton.waitForDisplayed();
    await this.oneHundredDollarButton.waitForDisplayed();
    await this.twoHundredDollarButton.waitForDisplayed();
    await this.customAmountButton.waitForDisplayed();
  }
}
