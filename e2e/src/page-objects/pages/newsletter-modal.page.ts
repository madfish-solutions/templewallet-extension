import { NewsletterOverlaySelectors } from 'src/app/layouts/PageLayout/NewsletterOverlay/NewsletterOverlay.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class NewsletterModalPage extends Page {
  closeButton = createPageElement(NewsletterOverlaySelectors.closeButton);
  emailInput = createPageElement(NewsletterOverlaySelectors.emailInput);
  subscribeButton = createPageElement(NewsletterOverlaySelectors.subscribeButton);

  async isVisible() {
    await this.closeButton.waitForDisplayed();
    await this.emailInput.waitForDisplayed();
    await this.subscribeButton.waitForDisplayed();
  }
}
