import { useSelector } from 'app/store';

import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationsRootState } from './state';

const getFilteredNotifications = (state: NotificationsRootState) => {
  const notifications = state.notifications.list.data;

  if (!state.notifications.isNewsEnabled) {
    return notifications.filter(notification => notification.type !== NotificationType.News);
  }

  return notifications;
};

export const useNotificationsSelector = () => useSelector(state => getFilteredNotifications(state));

export const useNotificationsItemSelector = (id: number) =>
  useSelector(state => state.notifications.list.data.find(notification => notification.id === id));

export const useNewNotificationsNumberSelector = () =>
  useSelector(
    state =>
      getFilteredNotifications(state).filter(notification => notification.status === NotificationStatus.New).length
  );

export const useIsNewNotificationsAvailableSelector = () =>
  useSelector(state =>
    getFilteredNotifications(state).some(notification => notification.status === NotificationStatus.New)
  );

export const useIsNewsEnabledSelector = () => useSelector(({ notifications }) => notifications.isNewsEnabled);
