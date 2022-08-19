import BigNumber from 'bignumber.js';

import { LatestEventsQuery } from 'generated/graphql';
import { t } from 'lib/i18n/react';

import {
  ActivityType,
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

export const mapLatestEventsToActivity = (publicKeyHash: string, data?: LatestEventsQuery) => {
  const result: Array<
    | TransactionActivityNotificationInterface
    | CollectibleSoldActivityNotificationInterface
    | CollectiblePurchasedActivityNotificationInterface
    | CollectibleResoldActivityNotificationInterface
    | CollectibleSellOfferActivityNotificationInterface
    | BidMadeActivityNotificationInterface
    | BidReceivedActivityNotificationInterface
    | BidOutbitedActivityNotificationInterface
  > = [];

  for (const event of (data ?? { events: [] }).events) {
    const eventType = predicateEventTypeToValidActivityType(event, publicKeyHash);
    if (eventType === null) {
      continue;
    }
    const { opid, timestamp, type, ophash, buyer_address, bidder_address, seller_address, token, price, auction_id } =
      event;
    const baseActivity = {
      id: opid,
      createdAt: timestamp,
      status: StatusType.New,
      title: mapEventTypeToTitle(eventType ?? ''),
      description: ''
    };

    switch (eventType) {
      case ActivityType.Transaction:
        result.push({ type: ActivityType.Transaction, ...baseActivity, transactionHash: ophash ?? '#' });
        break;
      case ActivityType.CollectiblePurchased:
        result.push({
          type: ActivityType.CollectiblePurchased,
          ...baseActivity,
          transactionAmount: new BigNumber(price ?? 0).div(10 ** 6).toString(),
          sellerAddress: seller_address ?? '#',
          collectibleName: token?.name ?? 'undefined',
          collectibleMarketplaceUrl: mapTypeToAssetUrl(
            type ?? '',
            token?.fa2_address ?? '',
            token?.token_id ?? '',
            token?.symbol ?? ''
          ),
          creatorAddress: token?.artist_address ?? '',
          creatorMarketplaceUrl: mapTypeToCreatorUrl(type ?? '', token?.artist_address ?? ''),
          marketplaceUrl: mapTypeToMarketplace(type ?? '')
        });
        break;
      case ActivityType.CollectibleSold:
        result.push({
          type: ActivityType.CollectibleSold,
          ...baseActivity,
          transactionAmount: new BigNumber(price ?? 0).div(10 ** 6).toString(),
          buyerAddress: buyer_address ?? '#',
          collectibleName: token?.name ?? 'undefined',
          collectibleMarketplaceUrl: mapTypeToAssetUrl(
            type ?? '',
            token?.fa2_address ?? '',
            token?.token_id ?? '',
            token?.symbol ?? ''
          ),
          creatorAddress: token?.artist_address ?? '',
          creatorMarketplaceUrl: mapTypeToCreatorUrl(type ?? '', token?.artist_address ?? ''),
          marketplaceUrl: mapTypeToMarketplace(type ?? '')
        });
        break;
      case ActivityType.CollectibleResold:
        result.push({
          type: ActivityType.CollectibleResold,
          ...baseActivity,
          royaltyAmount: new BigNumber(token?.royalties_total ?? 0).div(10 ** 6).toString(),
          buyerAddress: buyer_address ?? '#',
          sellerAddress: seller_address ?? '#',
          collectibleName: token?.name ?? 'undefined',
          collectibleMarketplaceUrl: mapTypeToAssetUrl(
            type ?? '',
            token?.fa2_address ?? '',
            token?.token_id ?? '',
            token?.symbol ?? ''
          ),
          creatorAddress: token?.artist_address ?? '',
          creatorMarketplaceUrl: mapTypeToCreatorUrl(type ?? '', token?.artist_address ?? ''),
          marketplaceUrl: mapTypeToMarketplace(type ?? '')
        });
        break;
      case ActivityType.CollectibleSellOffer:
        result.push({
          type: ActivityType.CollectibleSellOffer,
          ...baseActivity,
          offerAmount: new BigNumber(price ?? 0).div(10 ** 6).toString(),
          offerAddress: buyer_address ?? '#',
          collectibleName: token?.name ?? 'undefined',
          collectibleMarketplaceUrl: mapTypeToAssetUrl(
            type ?? '',
            token?.fa2_address ?? '',
            token?.token_id ?? '',
            token?.symbol ?? ''
          ),
          creatorAddress: token?.artist_address ?? '',
          creatorMarketplaceUrl: mapTypeToCreatorUrl(type ?? '', seller_address ?? ''),
          marketplaceUrl: mapTypeToMarketplace(type ?? '')
        });
        break;
      case ActivityType.BidMade:
        result.push({
          type: ActivityType.BidMade,
          ...baseActivity,
          bidAmount: new BigNumber(price ?? 0).div(10 ** 6).toString(),
          actionName: t('youMadeBid'),
          actionUrl: `https://objkt.com/auction/e/${auction_id}`,
          marketplaceUrl: mapTypeToMarketplace(type ?? '')
        });
        break;
      case ActivityType.BidReceived:
        result.push({
          type: ActivityType.BidReceived,
          ...baseActivity,
          bidAmount: new BigNumber(price ?? 0).div(10 ** 6).toString(),
          bidderAddress: bidder_address ?? '',
          actionName: t('youReceivedBid'),
          actionUrl: `https://objkt.com/auction/e/${auction_id}`,
          marketplaceUrl: mapTypeToMarketplace(type ?? '')
        });
        break;
    }
  }

  return result;
};

export const mapEventTypeToTitle = (type = ''): string => {
  switch (type) {
    case ActivityType.Transaction:
      return t('transaction');
    case ActivityType.CollectibleSellOffer:
      return t('youReceivedAnOffer');
    case ActivityType.CollectibleSold:
      return t('youSoldNft');
    case ActivityType.CollectiblePurchased:
      return t('youBoughtNft');
    case ActivityType.CollectibleResold:
      return t('nftWasResold');
    case ActivityType.BidMade:
      return t('youMadeBid');
    case ActivityType.BidReceived:
      return t('youReceivedBid');
    case ActivityType.BidOutbited:
      return t('yourBidWasOutbid');
    default:
      return t('topBid');
  }
};

const VALID_ACTIVITIES: Record<ActivityType, Array<string>> = {
  [ActivityType.Transaction]: ['FA2_TRANSFER'],
  [ActivityType.BakerRewards]: [],
  [ActivityType.CollectibleSold]: [
    'OBJKT_FULFILL_ASK',
    'OBJKT_FULFILL_ASK_V2',
    'OBJKT_FULFILL_OFFER',
    'OBJKT_BUY_DUTCH_AUCTION',
    'OBJKT_BUY_DUTCH_AUCTION_V2',
    'OBJKT_SETTLE_ENGLISH_AUCTION',
    'HEN_COLLECT_V2',
    'TEIA_COLLECT',
    'FX_COLLECT',
    'VERSUM_ACCEPT_OFFER'
  ],
  [ActivityType.CollectiblePurchased]: [
    'OBJKT_FULFILL_ASK',
    'OBJKT_FULFILL_ASK_V2',
    'OBJKT_FULFILL_OFFER',
    'OBJKT_BUY_DUTCH_AUCTION',
    'OBJKT_BUY_DUTCH_AUCTION_V2',
    'OBJKT_SETTLE_ENGLISH_AUCTION',
    'HEN_COLLECT_V2',
    'TEIA_COLLECT',
    'FX_COLLECT',
    'VERSUM_ACCEPT_OFFER'
  ],
  [ActivityType.CollectibleResold]: [
    'OBJKT_FULFILL_ASK',
    'OBJKT_FULFILL_ASK_V2',
    'OBJKT_FULFILL_OFFER',
    'OBJKT_BUY_DUTCH_AUCTION',
    'OBJKT_BUY_DUTCH_AUCTION_V2',
    'OBJKT_SETTLE_ENGLISH_AUCTION',
    'HEN_COLLECT_V2',
    'TEIA_COLLECT',
    'FX_COLLECT',
    'VERSUM_ACCEPT_OFFER'
  ],
  [ActivityType.CollectibleSellOffer]: ['OBJKT_OFFER', 'FX_OFFER', 'VERSUM_MAKE_OFFER'],
  [ActivityType.BidMade]: ['OBJKT_BID', 'OBJKT_BID_ENGLISH_AUCTION'],
  [ActivityType.BidReceived]: ['OBJKT_BID', 'OBJKT_BID_ENGLISH_AUCTION'],
  [ActivityType.BidOutbited]: []
};

const mapTypeToAssetUrl = (type: string, address: string, tokenId: string, symbol: string) => {
  if (type.indexOf('TEIA') >= 0) {
    return `https://teia.art/objkt/${tokenId}`;
  }
  if (type.indexOf('VERSUM') >= 0) {
    return `https://versum.xyz/token/versum/${tokenId}`;
  }
  if (type.indexOf('FX') >= 0) {
    return `https://www.fxhash.xyz/${symbol.toLowerCase()}/${tokenId}`;
  }
  return `https://objkt.com/asset/${address}/${tokenId}`;
};

const mapTypeToCreatorUrl = (type: string, pkh: string) => {
  if (type.indexOf('TEIA') >= 0) {
    return `https://teia.art/tz/${pkh}`;
  }
  if (type.indexOf('VERSUM') >= 0) {
    return `https://versum.xyz/user/${pkh}/created`;
  }
  if (type.indexOf('FX') >= 0) {
    return `https://www.fxhash.xyz/pkh/${pkh}`;
  }
  return `https://objkt.com/profile/${pkh}/created`;
};

const mapTypeToMarketplace = (type: string) => {
  if (type.indexOf('TEIA') >= 0) {
    return 'https://teia.art/';
  }
  if (type.indexOf('VERSUM') >= 0) {
    return 'https://versum.xyz/';
  }
  if (type.indexOf('FX') >= 0) {
    return 'https://www.fxhash.xyz/';
  }
  return 'https://objkt.com/';
};

const predicateEventTypeToValidActivityType = (
  {
    type,
    offerAddress,
    bidder_address,
    buyer_address,
    seller_address,
    artist_address,
    from_address,
    to_address,
    token
  }: {
    type?: string | null;
    offerAddress?: string | null;
    bidder_address?: string | null;
    buyer_address?: string | null;
    seller_address?: string | null;
    artist_address?: string | null;
    from_address?: string | null;
    to_address?: string | null;
    token?: { artist_address?: string | null } | null;
  },
  publicKeyHash: string
): ActivityType | null => {
  if (VALID_ACTIVITIES[ActivityType.Transaction].indexOf(type ?? '') >= 0) {
    if ((from_address ?? '').startsWith('tz') && (to_address ?? '').startsWith('tz')) return ActivityType.Transaction;
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleSold].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === seller_address) {
      return ActivityType.CollectibleSold;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.CollectiblePurchased].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === buyer_address) {
      return ActivityType.CollectiblePurchased;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleResold].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === artist_address || publicKeyHash === (token?.artist_address ?? '')) {
      return ActivityType.CollectibleResold;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleSellOffer].indexOf(type ?? '') >= 0) {
    if (publicKeyHash !== offerAddress) {
      return ActivityType.CollectibleSellOffer;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.BidMade].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === buyer_address) {
      return ActivityType.BidMade;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.BidReceived].indexOf(type ?? '') >= 0) {
    if (publicKeyHash !== bidder_address) {
      return ActivityType.BidReceived;
    }
  }
  return null;
};
