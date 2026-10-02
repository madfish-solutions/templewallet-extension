import { templeWalletApi } from './templewallet.api';

export const MAX_NOTIFICATION_ACCOUNT_ADDRESSES = 100;

export interface GetNotificationsParams {
  platform: string;
  startFromTime: number;
  /** Cursor id for account/Objkt notifications only. Broadcast items are filtered by `startFromTime`. */
  startID?: number;
  accountAddresses: string[];
}

export const fetchNotifications = <T>(params: GetNotificationsParams) =>
  templeWalletApi
    .get<T[]>('/notifications', {
      params: {
        platform: params.platform,
        startFromTime: params.startFromTime,
        startID: params.startID ?? 0,
        accountAddresses: params.accountAddresses.join(',')
      }
    })
    .then(({ data }) => data);
