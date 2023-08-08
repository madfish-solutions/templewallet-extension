import { useSelector } from 'app/store';
import type { RootState } from 'app/store/root-state.type';

import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationType } from '../enums/notification-type.enum';

const getFilteredNotifications = (state: RootState) => {
  const notifications = state.notifications.list.data;

  if (!state.notifications.isNewsEnabled) {
    return notifications.filter(notification => notification.type !== NotificationType.News);
  }

  return notifications;
};

export const useNotificationsSelector = () => useSelector(state => getFilteredNotifications(state));

export const useNotificationsItemSelector = (id: number) =>
  useSelector(state => state.notifications.list.data.find(notification => notification.id === id));

export const useNewNotificationsAmountSelector = () =>
  useSelector(
    state =>
      getFilteredNotifications(state).filter(notification => notification.status === NotificationStatus.New).length
  );

export const useIsNewsEnabledSelector = () => useSelector(({ notifications }) => notifications.isNewsEnabled);
