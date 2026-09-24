import { createReducer } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';

import { NotificationStatus } from 'app/pages/Notifications/enums/notification-status.enum';
import type { NotificationInterface } from 'app/pages/Notifications/types';
import { createEntity } from 'lib/store';

import {
  loadNotificationsAction,
  setIsNewsEnabledAction,
  setIsAccountNotificationsEnabledAction,
  readNotificationsItemAction,
  viewAllNotificationsAction
} from './actions';
import { notificationsInitialState, NotificationsState } from './state';
import { compareNotificationsNewestFirst, getLatestNotificationCreatedAt, isNotificationExpired } from './utils';

export const notificationsReducer = createReducer<NotificationsState>(notificationsInitialState, builder => {
  builder.addCase(loadNotificationsAction.submit, state => ({
    ...state,
    list: createEntity(state.list.data, true)
  }));
  builder.addCase(loadNotificationsAction.success, (state, { payload: notifications }) => {
    const now = Date.now();
    const notificationsById = new Map<number, NotificationInterface>();

    for (const notification of state.list.data) {
      if (!isNotificationExpired(notification, now)) {
        notificationsById.set(notification.id, notification);
      }
    }

    for (const notification of notifications) {
      if (isNotificationExpired(notification, now)) {
        continue;
      }

      const prevNotification = notificationsById.get(notification.id);
      notificationsById.set(
        notification.id,
        isDefined(prevNotification) ? { ...notification, status: prevNotification.status } : notification
      );
    }

    return {
      ...state,
      startFromTime: Math.max(state.startFromTime, getLatestNotificationCreatedAt(notifications)),
      list: createEntity(Array.from(notificationsById.values()).sort(compareNotificationsNewestFirst), false)
    };
  });
  builder.addCase(loadNotificationsAction.fail, state => ({
    ...state,
    list: createEntity(state.list.data, false)
  }));

  builder.addCase(viewAllNotificationsAction, state => ({
    ...state,
    list: createEntity(
      state.list.data.map(notification => {
        if (notification.status === NotificationStatus.New) {
          return {
            ...notification,
            status: NotificationStatus.Viewed
          };
        }

        return notification;
      })
    )
  }));
  builder.addCase(readNotificationsItemAction, (state, { payload: notificationId }) => ({
    ...state,
    list: createEntity(
      state.list.data.map(notification => {
        if (notification.id === notificationId) {
          return {
            ...notification,
            status: NotificationStatus.Read
          };
        }

        return notification;
      })
    )
  }));

  builder.addCase(setIsNewsEnabledAction, (state, { payload: isNewsEnabled }) => ({
    ...state,
    isNewsEnabled
  }));
  builder.addCase(setIsAccountNotificationsEnabledAction, (state, { payload: isAccountNotificationsEnabled }) => ({
    ...state,
    isAccountNotificationsEnabled
  }));
});
