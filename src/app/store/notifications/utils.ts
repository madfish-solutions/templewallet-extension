import { MAX_NOTIFICATION_ACCOUNT_ADDRESSES } from 'lib/constants';
import { isAccountNotificationType, type NotificationInterface } from 'lib/notifications';
import { StoredAccount } from 'lib/temple/types';
import { filterUnique, isTruthy } from 'lib/utils';
import { getAccountAddressForTezos } from 'temple/accounts';

/** Account notifications are keyed by Tezos addresses only. */
export const getTezosNotificationAccountAddresses = (accounts: StoredAccount[]) =>
  filterUnique(accounts.map(account => getAccountAddressForTezos(account)).filter(isTruthy)).slice(
    0,
    MAX_NOTIFICATION_ACCOUNT_ADDRESSES
  );

export const getLatestNotificationCreatedAt = (notifications: Array<Pick<NotificationInterface, 'createdAt'>>) =>
  notifications.reduce((latest, notification) => Math.max(latest, Date.parse(notification.createdAt)), 0);

/** Broadcast notification ids are createdAt millis and must not be used as the account-notification cursor. */
export const getAccountNotificationsStartID = (notifications: Array<Pick<NotificationInterface, 'id' | 'type'>>) =>
  notifications.reduce(
    (startID, notification) =>
      isAccountNotificationType(notification.type) ? Math.max(startID, notification.id) : startID,
    0
  );

export const compareNotificationsNewestFirst = (a: NotificationInterface, b: NotificationInterface) => {
  const createdAtDiff = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return b.id - a.id;
};

export const isNotificationExpired = (notification: NotificationInterface, now = Date.now()) => {
  const { expirationDate } = notification;

  return !!expirationDate && Date.parse(expirationDate) < now;
};
