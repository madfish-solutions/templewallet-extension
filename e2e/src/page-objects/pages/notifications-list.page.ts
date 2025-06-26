import { PreviewItemSelectors } from 'src/app/pages/Notifications/components/list-item/selectors';
import type { NotificationInterface } from 'src/app/pages/Notifications/types';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class NotificationsListPage extends Page {
  newNotification?: NotificationInterface;
  notificationItem = createPageElement(PreviewItemSelectors.notificationItem);
  notificationItemTitleText = createPageElement(PreviewItemSelectors.notificationItemTitleText);
  notificationItemDescriptionText = createPageElement(PreviewItemSelectors.notificationItemDescriptionText);

  async isVisible() {
    await this.notificationItem.waitForDisplayed();
    await this.notificationItemTitleText.waitForDisplayed();
    await this.notificationItemDescriptionText.waitForDisplayed();
  }
}
