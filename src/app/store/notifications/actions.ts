import { createAction } from '@reduxjs/toolkit';

import { NotificationInterface } from 'app/pages/Notifications/types';
import { createActions } from 'lib/store';

export const loadNotificationsAction = createActions<void, NotificationInterface[]>('notifications/LOAD_NOTIFICATIONS');

export const viewAllNotificationsAction = createAction<void>('notifications/VIEW_ALL_NOTIFICATIONS');
export const readNotificationsItemAction = createAction<number>('notifications/READ_NOTIFICATIONS_ITEM');

export const setIsNewsEnabledAction = createAction<boolean>('notifications/SET_IS_NEWS_ENABLED');
