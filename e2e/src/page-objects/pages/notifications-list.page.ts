import { PreviewItemSelectors } from 'src/lib/notifications/components/notifications/preview-item.selectors';

import { VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Page } from '../../classes/page.class';
import { createPageElement, findElement } from '../../utils/search.utils';

export class NotificationsListPage extends Page {
  notificationItem = createPageElement(PreviewItemSelectors.notificationItem);
  notificationItemTitleText = createPageElement(PreviewItemSelectors.notificationItemTitleText);
  notificationItemDescriptionText = createPageElement(PreviewItemSelectors.notificationItemDescriptionText);

  async isVisible() {
    await this.notificationItem.waitForDisplayed();
    await this.notificationItemTitleText.waitForDisplayed();
    await this.notificationItemDescriptionText.waitForDisplayed();
  }

  async isNotificationDisplayed(title: string, description: string) {
    const notificationText = await findElement(
      PreviewItemSelectors.notificationItemTitleText,
      { title },
      VERY_SHORT_TIMEOUT,
      `Notification with ${title} title is not displayed`
    );

    await findElement(
      PreviewItemSelectors.notificationItemDescriptionText,
      { description },
      VERY_SHORT_TIMEOUT,
      `Notification with ${description} description is not displayed`
    );

    return notificationText;
  }

  async clickOnTheNotification(title: string, description: string) {
    const selectedNotification = await this.isNotificationDisplayed(title, description);
    await selectedNotification.click();
  }

  async isNotificationNotDisplayed(title: string, description: string) {
    await this.isNotificationDisplayed(title, description).then(
      () => {
        throw new Error(`The notification '${title}' is displayed after turning off 'news' checkbox in settings`);
      },
      () => undefined
    );
  }
}
