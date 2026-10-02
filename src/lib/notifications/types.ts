import type { NotificationPlatformType } from './notification-platform-type';
import type { NotificationStatus } from './notification-status';
import type { NotificationType } from './notification-type';

interface NotificationLink {
  text: string;
  url: string;
}

export interface NotificationInterface {
  id: number;
  status: NotificationStatus;
  createdAt: string;
  type: NotificationType;
  platforms: NotificationPlatformType[];
  language: string;
  title: string;
  description: string;
  content: Array<string | NotificationLink>;
  extensionImageUrl: string;
  mobileImageUrl: string;
  sourceUrl?: string;
  expirationDate?: string;
  isMandatory?: boolean;
  accountAddresses?: string[];
}
