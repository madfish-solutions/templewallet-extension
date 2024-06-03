import { PreviewItemSelectors } from 'src/lib/notifications/components/notifications/preview-item.selectors';
import type { NotificationInterface } from 'src/lib/notifications/types';

import { VERY_SHORT_TIMEOUT } from 'src/utils/timing.utils';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

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
