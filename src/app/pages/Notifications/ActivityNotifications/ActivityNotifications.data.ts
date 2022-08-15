import {
  ActivityType,
  BakerRewardsActivityNotificationInterface,
  BidMadeActivityNotificationInterface,
  BidOutbitedActivityNotificationInterface,
  BidReceivedActivityNotificationInterface,
  CollectiblePurchasedActivityNotificationInterface,
  CollectibleResoldActivityNotificationInterface,
  CollectibleSellOfferActivityNotificationInterface,
  CollectibleSoldActivityNotificationInterface,
  StatusType,
  TransactionActivityNotificationInterface
} from './ActivityNotifications.interface';

const transactionNotifications: Array<TransactionActivityNotificationInterface> = [
  {
    id: '1t',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.Transaction,
    title: 'Transaction kind',
    description: 'Transaction description',
    transactionHash: 'onk5ZxztDpkiYKgrg8NVdvjG3xTVZmhdicBefSuTwby891AHNPc'
  },
  {
    id: '2t',
    createdAt: '2022-01-01T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.Transaction,
    title: 'Transaction evil',
    description: 'Transaction description',
    transactionHash: 'op8aJ6mZABBRDtqdEPKiize5fkQJvyqpeJKofK4zgj5LXmN3cDB'
  }
];

const bakerNotifications: Array<BakerRewardsActivityNotificationInterface> = [
  {
    id: '1b',
    createdAt: '2020-01-02T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.BakerRewards,
    title: 'BakerReward kind',
    description: 'BakerReward description',
    transactionHash: 'ongEJway6ZPKwSSj4Dy75mKYRUH7nTkbwBpzP3k2AVdr51pif8V',
    rewardAmount: '0.1',
    rewardLuck: '0.2'
  },
  {
    id: '2b',
    createdAt: '2022-01-02T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.BakerRewards,
    title: 'BakerReward evil',
    description: 'BakerReward description',
    transactionHash: 'ooiWtEGE8aC3UkyqSKnqkRaDU7gq9ox4NxUdEP6R7CTr4ECy85k',
    rewardAmount: '0.3',
    rewardLuck: '0.4'
  },
  {
    id: '3b',
    createdAt: '2022-01-04T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.BakerRewards,
    title: 'BakerReward evil2',
    description: 'BakerReward description',
    transactionHash: 'opACFH9sDXi5d1P1fL3RYUC1hi8qeT5K2Ed8WQT7MUM3kynLe48',
    rewardAmount: '2',
    rewardLuck: '0.4'
  }
];

const collectibleSold: Array<CollectibleSoldActivityNotificationInterface> = [
  {
    id: '1cs',
    createdAt: '2020-01-02T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.CollectibleSold,
    title: 'Collectible Sold kind',
    description: 'Collectible Sold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761048',
    transactionAmount: '1',
    buyerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '2cs',
    createdAt: '2020-01-03T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.CollectibleSold,
    title: 'Collectible Sold kind',
    description: 'Collectible Sold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761976',
    transactionAmount: '10',
    buyerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '3cs',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.CollectibleSold,
    title: 'Collectible Sold kind',
    description: 'Collectible Sold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761048',
    transactionAmount: '4',
    buyerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  }
];

const collectiblePurchased: Array<CollectiblePurchasedActivityNotificationInterface> = [
  {
    id: '1cp',
    createdAt: '2020-01-12T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.CollectiblePurchased,
    title: 'Collectible Purchased kind',
    description: 'Collectible Purchased description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761048',
    transactionAmount: '1',
    sellerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '2cp',
    createdAt: '2020-02-03T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.CollectiblePurchased,
    title: 'Collectible Purchased kind',
    description: 'Collectible Purchased description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761976',
    transactionAmount: '10',
    sellerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '3cp',
    createdAt: '2020-01-01T10:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.CollectiblePurchased,
    title: 'Collectible Purchased kind',
    description: 'Collectible Purchased description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761048',
    transactionAmount: '4',
    sellerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  }
];

const collectibleResold: Array<CollectibleResoldActivityNotificationInterface> = [
  {
    id: '1cr',
    createdAt: '2020-01-02T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.CollectibleResold,
    title: 'Collectible ReSold kind',
    description: 'Collectible ReSold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761048',
    royaltyAmount: '1',
    buyerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    sellerAddress: 'tz1f7C7HeTczoCxoo8oQ3vBDRQTiNM3tFTZu',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '2cr',
    createdAt: '2020-01-03T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.CollectibleResold,
    title: 'Collectible ReSold kind',
    description: 'Collectible ReSold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761976',
    royaltyAmount: '10',
    buyerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    sellerAddress: 'tz1f7C7HeTczoCxoo8oQ3vBDRQTiNM3tFTZu',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '3cr',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.CollectibleResold,
    title: 'Collectible ReSold kind',
    description: 'Collectible ReSold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761048',
    royaltyAmount: '4',
    buyerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    sellerAddress: 'tz1f7C7HeTczoCxoo8oQ3vBDRQTiNM3tFTZu',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  }
];

const collectibleOffers: Array<CollectibleSellOfferActivityNotificationInterface> = [
  {
    id: '1co',
    createdAt: '2020-01-02T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.CollectibleSellOffer,
    title: 'Collectible offerSold kind',
    description: 'Collectible offerSold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761048',
    offerAmount: '1',
    offerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '2co',
    createdAt: '2020-01-03T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.CollectibleSellOffer,
    title: 'Collectible offerSold kind',
    description: 'Collectible offerSold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761976',
    offerAmount: '10',
    offerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '3co',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.CollectibleSellOffer,
    title: 'Collectible offerSold kind',
    description: 'Collectible offerSold description',
    collectibleName: 'Collectible name',
    collectibleMarketplaceUrl: 'https://objkt.com/asset/hicetnunc/761048',
    offerAmount: '4',
    offerAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    creatorAddress: 'e-m-i.tez',
    creatorMarketplaceUrl: 'https://objkt.com/@e-m-i',
    marketplaceUrl: 'https://objkt.com/'
  }
];

const bidsMade: Array<BidMadeActivityNotificationInterface> = [
  {
    id: '1bm',
    createdAt: '2020-01-02T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.BidMade,
    title: 'Bid made kind',
    description: 'Bid made description',
    actionName: 'Bid made action',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761048',
    bidAmount: '1',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '2bm',
    createdAt: '2020-01-03T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.BidMade,
    title: 'Bid made kind',
    description: 'Bid made description',
    actionName: 'Bid made action',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761976',
    bidAmount: '10',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '3bm',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.BidMade,
    title: 'Bid made kind',
    description: 'Bid made description',
    actionName: 'Bid made action',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761048',
    bidAmount: '4',
    marketplaceUrl: 'https://objkt.com/'
  }
];

const bidsReceived: Array<BidReceivedActivityNotificationInterface> = [
  {
    id: '1br',
    createdAt: '2020-01-02T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.BidReceived,
    title: 'Bid receive kind',
    description: 'Bid receive description',
    actionName: 'Bid made action',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761048',
    bidAmount: '1',
    bidderAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '2br',
    createdAt: '2020-01-03T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.BidReceived,
    title: 'Bid receive kind',
    description: 'Bid receive description',
    actionName: 'Bid made action',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761976',
    bidAmount: '10',
    bidderAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '3br',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.BidReceived,
    title: 'Bid receive kind',
    description: 'Bid receive description',
    actionName: 'Bid made action',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761048',
    bidAmount: '4',
    bidderAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    marketplaceUrl: 'https://objkt.com/'
  }
];

const bidsOutbidded: Array<BidOutbitedActivityNotificationInterface> = [
  {
    id: '1bo',
    createdAt: '2020-01-02T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.BidOutbited,
    title: 'Bid outbided kind',
    description: 'Bid outbided description',
    actionName: 'Bid made action',
    bidderAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    topBidAmount: '214',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761048',
    bidAmount: '1',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '2bo',
    createdAt: '2020-01-03T00:00:00.000Z',
    status: StatusType.Viewed,
    type: ActivityType.BidOutbited,
    title: 'Bid outbided kind',
    description: 'Bid outbided description',
    actionName: 'Bid made action',
    bidderAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    topBidAmount: '2124',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761976',
    bidAmount: '10',
    marketplaceUrl: 'https://objkt.com/'
  },
  {
    id: '3bo',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: ActivityType.BidOutbited,
    title: 'Bid outbided kind',
    description: 'Bid outbided description',
    actionName: 'Bid made action',
    bidderAddress: 'tz1Xa6fJvCLeHrwzcnYFPADxStFPoKHPTU1k',
    topBidAmount: '21224',
    actionUrl: 'https://objkt.com/asset/hicetnunc/761048',
    bidAmount: '4',
    marketplaceUrl: 'https://objkt.com/'
  }
];

export const activityNotificationsMockData: Array<
  | TransactionActivityNotificationInterface
  | BakerRewardsActivityNotificationInterface
  | CollectibleSoldActivityNotificationInterface
  | CollectiblePurchasedActivityNotificationInterface
  | CollectibleResoldActivityNotificationInterface
  | CollectibleSellOfferActivityNotificationInterface
  | BidMadeActivityNotificationInterface
  | BidReceivedActivityNotificationInterface
  | BidOutbitedActivityNotificationInterface
> = [
  ...transactionNotifications,
  ...bakerNotifications,
  ...collectibleSold,
  ...collectiblePurchased,
  ...collectibleResold,
  ...collectibleOffers,
  ...bidsMade,
  ...bidsReceived,
  ...bidsOutbidded
];
