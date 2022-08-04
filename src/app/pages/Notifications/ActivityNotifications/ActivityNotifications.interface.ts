export enum ActivityType {
  Transaction = 'Transaction',
  BakerRewards = 'BakerRewards',
  CollectibleSold = 'CollectibleSold',
  CollectiblePurchased = 'CollectiblePurchased',
  CollectibleResold = 'CollectibleResold',
  CollectibleSellOffer = 'CollectibleSellOffer',
  BidMade = 'BidMade',
  BidReceived = 'BidReceived',
  BidOutbited = 'BidOutbited'
}

export enum StatusType {
  New = 'New',
  Read = 'Read',
  Viewed = 'Viewed'
}

export interface ActivityNotificationsInterface {
  id: string;
  createdAt: string;
  status: StatusType;
  type: ActivityType;
  title: string;
  description?: string;
}

export interface TransactionActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.Transaction;
  transactionHash: string;
}

export interface BakerRewardsActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.BakerRewards;
  transactionHash: string;
  rewardAmount: string;
  rewardLuck: string;
}

export interface CollectibleSoldActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.CollectibleSold;
  collectibleName: string;
  collectibleMarketplaceUrl: string;
  transactionAmount: string;
  buyerAddress: string;
  creatorName: string;
  creatorMarketplaceUrl: string;
  marketplaceUrl: string;
}

export interface CollectiblePurchasedActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.CollectiblePurchased;
  collectibleName: string;
  collectibleMarketplaceUrl: string;
  transactionAmount: string;
  sellerAddress: string;
  creatorName: string;
  creatorMarketplaceUrl: string;
  marketplaceUrl: string;
}

export interface CollectibleResoldActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.CollectibleResold;
  collectibleName: string;
  collectibleMarketplaceUrl: string;
  royaltyAmount: string;
  buyerAddress: string;
  sellerAddress: string;
  creatorName: string;
  creatorMarketplaceUrl: string;
  marketplaceUrl: string;
}

export interface CollectibleSellOfferActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.CollectibleSellOffer;
  collectibleName: string;
  collectibleMarketplaceUrl: string;
  offerAmount: string;
  offerAddress: string;
  creatorName: string;
  creatorMarketplaceUrl: string;
  marketplaceUrl: string;
}

export interface BidMadeActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.BidMade;
  bidAmount: string;
  actionName: string;
  actionUrl: string;
  marketplaceUrl: string;
}

export interface BidReceivedActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.BidReceived;
  bidAmount: string;
  actionName: string;
  actionUrl: string;
  bidderAddress: string;
  marketplaceUrl: string;
}

export interface BidOutbitedActivityNotificationInterface extends ActivityNotificationsInterface {
  type: ActivityType.BidOutbited;
  bidAmount: string;
  actionName: string;
  actionUrl: string;
  bidderAddress: string;
  topBidAmount: string;
  marketplaceUrl: string;
}
