import { createAction } from '@reduxjs/toolkit';

import { NotificationInterface } from 'lib/notifications';
import { createActions } from 'lib/store';

interface LoadNotificationsPayload {
  accountAddresses: string[];
}

interface LoadNotificationsSuccessPayload {
  notifications: NotificationInterface[];
  /** Clock time for expiry checks. Callers pass it so the reducer stays deterministic. */
  timestamp: number;
}

export const loadNotificationsAction = createActions<LoadNotificationsPayload, LoadNotificationsSuccessPayload>(
  'notifications/LOAD_NOTIFICATIONS'
);

export const viewAllNotificationsAction = createAction<void>('notifications/VIEW_ALL_NOTIFICATIONS');
export const readNotificationsItemAction = createAction<number>('notifications/READ_NOTIFICATIONS_ITEM');

export const setIsNewsEnabledAction = createAction<boolean>('notifications/SET_IS_NEWS_ENABLED');
export const setIsAccountNotificationsEnabledAction = createAction<boolean>(
  'notifications/SET_IS_ACCOUNT_NOTIFICATIONS_ENABLED'
);
