import type { NotificationInterface } from 'lib/notifications';

import { getAccountNotificationsStartID, getLatestNotificationCreatedAt } from './utils';

export const NOTIFICATIONS_PERSIST_ROOT_KEY = 'persist:temple-root';

interface PersistedNotificationsSlice {
  startFromTime?: number;
  list?: { data?: NotificationInterface[] };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPendingNotification = (item: unknown): item is NotificationInterface => {
  if (!isRecord(item)) {
    return false;
  }

  return typeof item.id === 'number' && typeof item.createdAt === 'string';
};

const parseSlice = (slice: unknown): PersistedNotificationsSlice | undefined => {
  if (typeof slice === 'string') {
    try {
      return parseSlice(JSON.parse(slice));
    } catch {
      return undefined;
    }
  }

  if (!isRecord(slice)) {
    return undefined;
  }

  const list = slice.list;
  const data = isRecord(list) && Array.isArray(list.data) ? list.data.filter(isPendingNotification) : undefined;

  return {
    startFromTime: typeof slice.startFromTime === 'number' ? slice.startFromTime : undefined,
    list: data ? { data } : undefined
  };
};

const finiteOrZero = (value: number) => (Number.isFinite(value) ? value : 0);

export interface NotificationsCursor {
  startFromTime: number;
  startID: number;
}

/** Moves the request cursor past rows already fetched, without dropping them from the snapshot. */
export const cursorCoveringNotifications = (
  base: NotificationsCursor,
  notifications: Array<Pick<NotificationInterface, 'id' | 'createdAt' | 'type'>>
): NotificationsCursor => ({
  startFromTime: Math.max(base.startFromTime, finiteOrZero(getLatestNotificationCreatedAt(notifications))),
  startID: Math.max(base.startID, getAccountNotificationsStartID(notifications))
});

export const mergeNotifications = <T extends { id: number }>(current: T[], incoming: T[]): T[] => {
  const byId = new Map<number, T>();

  for (const notification of current) {
    byId.set(notification.id, notification);
  }

  for (const notification of incoming) {
    byId.set(notification.id, notification);
  }

  return [...byId.values()];
};

/** Matches the notifications epic: time watermark plus the account-notification id cursor. */
export const readPersistedNotificationsCursor = (root: unknown, now = Date.now()) => {
  const notifications = isRecord(root) ? parseSlice(root.notifications) : undefined;
  const list = Array.isArray(notifications?.list?.data) ? notifications.list.data : [];
  const startFromTime =
    typeof notifications?.startFromTime === 'number' && Number.isFinite(notifications.startFromTime)
      ? notifications.startFromTime
      : now;

  return {
    startFromTime: Math.max(startFromTime, finiteOrZero(getLatestNotificationCreatedAt(list))),
    startID: getAccountNotificationsStartID(list)
  };
};

export const parsePendingAccountNotifications = (value: unknown): NotificationInterface[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isPendingNotification);
};
