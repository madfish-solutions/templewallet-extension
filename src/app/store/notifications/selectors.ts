import { useMemo } from 'react';

import { NotificationStatus } from 'app/pages/Notifications/enums/notification-status.enum';
import { NotificationType } from 'app/pages/Notifications/enums/notification-type.enum';
import { useSelector } from 'app/store/index';

export const useNotificationsSelector = () => {
  const notifications = useSelector(state => state.notifications.list.data);
  const isNewsEnabled = useSelector(state => state.notifications.isNewsEnabled);

  return useMemo(
    () =>
      isNewsEnabled ? notifications : notifications.filter(notification => notification.type !== NotificationType.News),
    [notifications, isNewsEnabled]
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
