import { isAccountNotificationType } from 'app/pages/Notifications/enums/notification-type.enum';
import type { NotificationInterface } from 'app/pages/Notifications/types';
import { MAX_NOTIFICATION_ACCOUNT_ADDRESSES } from 'lib/apis/temple/endpoints/get-notifications';
import { StoredAccount } from 'lib/temple/types';
import { filterUnique, isTruthy } from 'lib/utils';
import { getAccountAddressForTezos } from 'temple/accounts';

export const ACCOUNT_NOTIFICATION_POPUP_DURATION_MS = 3_000;

/** Account notifications are keyed by Tezos addresses only. */
export const getTezosNotificationAccountAddresses = (accounts: StoredAccount[]): string[] =>
  filterUnique(accounts.map(getAccountAddressForTezos).filter(isTruthy)).slice(0, MAX_NOTIFICATION_ACCOUNT_ADDRESSES);

export const getLatestNotificationCreatedAt = (notifications: NotificationInterface[]): number =>
  notifications.reduce((latest, notification) => Math.max(latest, new Date(notification.createdAt).getTime()), 0);

/** Broadcast notification ids are createdAt millis and must not be used as the account-notification cursor. */
export const getAccountNotificationsStartID = (notifications: NotificationInterface[]): number =>
  notifications.reduce(
    (startID, notification) =>
      isAccountNotificationType(notification.type) ? Math.max(startID, notification.id) : startID,
    0
  );

export const compareNotificationsNewestFirst = (a: NotificationInterface, b: NotificationInterface): number => {
  const createdAtDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return b.id - a.id;
};

export const isNotificationExpired = (notification: NotificationInterface, now = Date.now()): boolean => {
  const { expirationDate } = notification;
  if (!expirationDate) {
    return false;
  }

  return new Date(expirationDate).getTime() < now;
};
