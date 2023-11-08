import retry from 'async-retry';
import { PreviewItemSelectors } from 'src/lib/notifications/components/notifications/preview-item.selectors';

import { RETRY_OPTIONS } from 'e2e/src/utils/timing.utils';

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

  async isNotificationNotDisplayed(title: string, shortDescription: string) {
    await retry(
      async () =>
        (await findElement(PreviewItemSelectors.notificationItemTitleText, { title })) &&
        findElement(PreviewItemSelectors.notificationItemDescriptionText, { shortDescription }).then(
          () => {
            throw new Error(`The notification '${title}' is displayed after turning off 'news' checkbox in settings`);
          },
          () => undefined
        ),
      RETRY_OPTIONS
    );
  }
}
