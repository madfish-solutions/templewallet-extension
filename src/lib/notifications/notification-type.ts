export enum NotificationType {
  News = 'News',
  PlatformUpdate = 'PlatformUpdate',
  SecurityNote = 'SecurityNote',
  OfferReceived = 'OfferReceived',
  AuctionBid = 'AuctionBid',
  NftSold = 'NftSold'
}

export type AccountNotificationType =
  | NotificationType.OfferReceived
  | NotificationType.AuctionBid
  | NotificationType.NftSold;

export const ACCOUNT_NOTIFICATION_TYPES: AccountNotificationType[] = [
  NotificationType.OfferReceived,
  NotificationType.AuctionBid,
  NotificationType.NftSold
];

export const isAccountNotificationType = (type: NotificationType): type is AccountNotificationType =>
  ACCOUNT_NOTIFICATION_TYPES.some(accountNotificationType => accountNotificationType === type);
