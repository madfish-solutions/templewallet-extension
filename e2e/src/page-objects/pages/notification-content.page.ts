import { NotificationsContentSelectors } from 'src/app/pages/Notifications/components/notification-modal/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

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
