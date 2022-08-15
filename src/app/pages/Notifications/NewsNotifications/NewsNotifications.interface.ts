export enum NewsType {
  News = 'News',
  ApplicationUpdate = 'ApplicationUpdate',
  Alert = 'Alert'
}

export enum PlatformType {
  Mobile = 'Mobile',
  Extension = 'Extension'
}

export enum StatusType {
  New = 'New',
  Read = 'Read',
  Viewed = 'Viewed'
}

export interface NewsNotificationInterface {
  id: string;
  createdAt: string;
  status: StatusType;
  type: NewsType;
  platform: PlatformType;
  language: string;
  title: string;
  description: string;
  content: string;
  extensionImageUrl: string;
  mobileImageUrl: string;
  readInOriginalUrl: string;
}

export interface NewsNotificationsApiProps {
  welcome?: boolean;
  platform?: PlatformType;
  limit?: string;
  page?: string;
  timeLt?: string;
  timeGt?: string;
  sorted?: SortedBy;
}

export enum SortedBy {
  DateAsc = '0',
  DateDesc = '1'
}
