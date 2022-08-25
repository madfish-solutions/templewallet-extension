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

type GeneralEventsType = {
  __typename?: 'events';
  type?: string | null;
  timestamp: any;
  amount?: any | null;
  auction_id?: any | null;
  owner_address?: string | null;
  from_address?: string | null;
  to_address?: string | null;
  bidder_address?: string | null;
  buyer_address?: string | null;
  seller_address?: string | null;
  artist_address?: string | null;
  opid: any;
  ophash?: string | null;
  start_time: any | null;
  end_time: any | null;
  price?: any | null;
  token?: {
    __typename?: 'tokens';
    fa2_address: string;
    token_id: string;
    artist_address?: string | null;
    symbol?: string | null;
    name?: string | null;
    description?: string | null;
    price?: any | null;
    royalties?: any | null;
    royalties_total?: any | null;
  } | null;
};

export type LatestEventsQuery = {
  __typename?: 'query_root';
  events: Array<GeneralEventsType>;
};

export type OutbidedEventsQuery = {
  __typename?: 'query_root';
  events: Array<GeneralEventsType & { currentPrice?: any | null }>;
};
