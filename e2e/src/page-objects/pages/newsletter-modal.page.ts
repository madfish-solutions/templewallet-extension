import { NewsletterOverlaySelectors } from 'src/app/layouts/PageLayout/NewsletterOverlay/NewsletterOverlay.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

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
