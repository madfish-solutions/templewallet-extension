import { Given } from '@cucumber/cucumber';

import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';

Given(
  /I check that a notification with (.*) title and (.*) description is not displayed/,
  { timeout: MEDIUM_TIMEOUT },
  async (title: string, shortDescription: string) => {
    await Pages.NotificationsList.isNotificationNotDisplayed(title, shortDescription);
  }
);
