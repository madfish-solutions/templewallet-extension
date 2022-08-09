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

export interface BaseCollectibleActivityNotificationInterface extends ActivityNotificationsInterface {
  collectibleName: string;
  marketplaceUrl: string;
  collectibleMarketplaceUrl: string;
  creatorAddress: string;
  creatorMarketplaceUrl: string;
}

export interface BaseBidActivityNotificationInterface extends ActivityNotificationsInterface {
  bidAmount: string;
  actionName: string;
  actionUrl: string;
  marketplaceUrl: string;
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

export interface CollectibleSoldActivityNotificationInterface extends BaseCollectibleActivityNotificationInterface {
  type: ActivityType.CollectibleSold;
  transactionAmount: string;
  buyerAddress: string;
}

export interface CollectiblePurchasedActivityNotificationInterface
  extends BaseCollectibleActivityNotificationInterface {
  type: ActivityType.CollectiblePurchased;
  transactionAmount: string;
  sellerAddress: string;
}

export interface CollectibleResoldActivityNotificationInterface extends BaseCollectibleActivityNotificationInterface {
  type: ActivityType.CollectibleResold;
  royaltyAmount: string;
  buyerAddress: string;
  sellerAddress: string;
}

export interface CollectibleSellOfferActivityNotificationInterface
  extends BaseCollectibleActivityNotificationInterface {
  type: ActivityType.CollectibleSellOffer;
  offerAmount: string;
  offerAddress: string;
}

export interface BidMadeActivityNotificationInterface extends BaseBidActivityNotificationInterface {
  type: ActivityType.BidMade;
}

export interface BidReceivedActivityNotificationInterface extends BaseBidActivityNotificationInterface {
  type: ActivityType.BidReceived;
  bidderAddress: string;
}

export interface BidOutbitedActivityNotificationInterface extends BaseBidActivityNotificationInterface {
  type: ActivityType.BidOutbited;
  bidderAddress: string;
  topBidAmount: string;
}
