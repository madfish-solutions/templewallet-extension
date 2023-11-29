import { Given } from '@cucumber/cucumber';
import assert from 'assert';
import axios from 'axios';
import type { NotificationInterface } from 'src/lib/notifications/types';

import { envVars } from 'e2e/src/utils/env.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';

Given(/I check that new notification is displayed/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const notification = Pages.NotificationsList.newNotification;
  assert(notification);
  await Pages.NotificationsList.isNotificationDisplayed(notification);
});

Given(/I check that new notification is NOT displayed/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const notification = Pages.NotificationsList.newNotification;
  assert(notification);
  await Pages.NotificationsList.isNotificationNotDisplayed(notification);
});

Given(/I click on the new notification/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const notification = Pages.NotificationsList.newNotification;
  assert(notification);
  await Pages.NotificationsList.clickOnTheNotification(notification);
});

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

  const response = await axios.post<NotificationInterface>(
    'https://temple-api-mainnet.stage.madfish.xyz/api/notifications',
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: envVars.NOTIFICATION_AUTHORIZATION
      }
    }
  );

  if (response.status !== 200)
    throw new Error(
      `Some problems with backend server. Server returns ${response.statusText} with ${response.status} status code`
    );

  Pages.NotificationsList.newNotification = response.data;
});
