import { useMemo } from 'react';

import { useSelector } from 'app/store/index';
import { isAccountNotificationType, NotificationStatus, NotificationType } from 'lib/notifications';

export const useNotificationsSelector = () => {
  const notifications = useSelector(state => state.notifications.list.data);
  const isNewsEnabled = useSelector(state => state.notifications.isNewsEnabled);
  const isAccountNotificationsEnabled = useSelector(state => state.notifications.isAccountNotificationsEnabled);

  return useMemo(
    () =>
      notifications.filter(notification => {
        if (notification.type === NotificationType.News) {
          return isNewsEnabled;
        }

        if (isAccountNotificationType(notification.type)) {
          return isAccountNotificationsEnabled;
        }

        return true;
      }),
    [notifications, isNewsEnabled, isAccountNotificationsEnabled]
  );
};

export const useNotificationsItemSelector = (id: number) =>
  useSelector(state => state.notifications.list.data.find(notification => notification.id === id));

export const useNewNotificationsAmountSelector = () => {
  const notifications = useNotificationsSelector();

  return useMemo(
    () => notifications.filter(notification => notification.status === NotificationStatus.New).length,
    [notifications]
  );
};

export const useIsNewsEnabledSelector = () => useSelector(({ notifications }) => notifications.isNewsEnabled);

export const useIsAccountNotificationsEnabledSelector = () =>
  useSelector(({ notifications }) => notifications.isAccountNotificationsEnabled);
