import { createAction } from '@reduxjs/toolkit';

import { NotificationInterface } from 'lib/notifications';
import { createActions } from 'lib/store';

export interface LoadNotificationsPayload {
  accountAddresses: string[];
}

export const loadNotificationsAction = createActions<LoadNotificationsPayload, NotificationInterface[]>(
  'notifications/LOAD_NOTIFICATIONS'
);

export const viewAllNotificationsAction = createAction<void>('notifications/VIEW_ALL_NOTIFICATIONS');
export const readNotificationsItemAction = createAction<number>('notifications/READ_NOTIFICATIONS_ITEM');

export const setIsNewsEnabledAction = createAction<boolean>('notifications/SET_IS_NEWS_ENABLED');
export const setIsAccountNotificationsEnabledAction = createAction<boolean>(
  'notifications/SET_IS_ACCOUNT_NOTIFICATIONS_ENABLED'
);
