import { Given } from '@cucumber/cucumber';
import axios from 'axios';

import { envVars } from 'e2e/src/utils/env.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';

Given(
  /I check that a notification with '(.*)' title and '(.*)' description is displayed/,
  { timeout: MEDIUM_TIMEOUT },
  async (title: string, shortDescription: string) => {
    await Pages.NotificationsList.isNotificationDisplayed(title, shortDescription);
  }
);

Given(
  /I check that a notification with '(.*)' title and '(.*)' description is NOT displayed/,
  { timeout: MEDIUM_TIMEOUT },
  async (title: string, shortDescription: string) => {
    await Pages.NotificationsList.isNotificationNotDisplayed(title, shortDescription);
  }
);

Given(
  /I click on the notification with '(.*)' title and '(.*)' description/,
  { timeout: MEDIUM_TIMEOUT },
  async (title: string, shortDescription: string) => {
    await Pages.NotificationsList.clickOnTheNotification(title, shortDescription);
  }
);

Given(/I make request for creating a notification/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const currentDate = new Date();
  const currentDateISO = new Date().toISOString();
  const expirationDateISO = new Date(currentDate.getTime() + 60000).toISOString(); // Notification will be deleted in 4 minutes

  const requestBody = {
    mobile: 'off',
    extension: 'on',
    type: 'News',
    title: 'Test Title',
    description: 'Test description',
    extensionImageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtIvsRFAUjlUKqlsLnrrJnWtcx98vOncHTXQ&usqp=CAU',
    mobileImageUrl: '',
    content: 'Test content',
    date: currentDateISO,
    expirationDate: expirationDateISO
  };

  const response = await axios.post('https://temple-api-mainnet.stage.madfish.xyz/api/notifications', requestBody, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: envVars.NOTIFICATION_AUTHORIZATION
    }
  });

  if (response.status !== 200)
    throw new Error(
      `Some problems with backend server. Server returns ${response.statusText} with ${response.status} status code`
    );
});
