import {
  NewsNotificationInterface,
  PlatformType,
  SortedBy
} from 'app/pages/Notifications/NewsNotifications/NewsNotifications.interface';

import { templewalletQuery } from './templewallet-query';

export const getNewsCount = templewalletQuery<
  {
    welcome?: boolean;
    platform?: PlatformType;
    limit?: string;
    page?: string;
    timeLt?: string;
    timeGt?: string;
    sorted?: SortedBy;
  },
  { count: number }
>('GET', '/news/count', ['welcome', 'platform', 'limit', 'timeGt', 'timeLt']);
export const getNewsItems = templewalletQuery<
  {
    welcome?: boolean;
    platform?: PlatformType;
    limit?: string;
    page?: string;
    timeLt?: string;
    timeGt?: string;
    sorted?: SortedBy;
  },
  NewsNotificationInterface[]
>('GET', '/news', ['welcome', 'platform', 'limit', 'timeGt', 'timeLt']);
