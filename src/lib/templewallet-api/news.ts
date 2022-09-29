import { NewsNotificationInterface, PlatformType, SortedBy } from 'app/store/news/news-interfaces';

import { templewalletQuery } from './templewallet-query';

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
>('GET', '/news', ['welcome', 'platform', 'limit', 'timeGt', 'timeLt', 'page', 'sorted']);
