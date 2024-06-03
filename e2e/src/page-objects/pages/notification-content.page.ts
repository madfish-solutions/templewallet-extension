import { NotificationsContentSelectors } from 'src/lib/notifications/components/item/notifications-content.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class NotificationContentPage extends Page {
  notificationContentTitle = createPageElement(NotificationsContentSelectors.notificationContentTitle);
  notificationContentDescription = createPageElement(NotificationsContentSelectors.notificationContentDescription);
  gotItButton = createPageElement(NotificationsContentSelectors.gotItButton);

  async isVisible() {
    await this.notificationContentTitle.waitForDisplayed();
    await this.notificationContentDescription.waitForDisplayed();
    await this.gotItButton.waitForDisplayed();
  }
}
