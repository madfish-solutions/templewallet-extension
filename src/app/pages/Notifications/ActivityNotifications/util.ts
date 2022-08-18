import BigNumber from 'bignumber.js';

import { LatestEventsQuery } from 'generated/graphql';
import { t } from 'lib/i18n/react';

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

export const mapLatestEventsToActivity = (
  publicKeyHash: string,
  data?: LatestEventsQuery
): Array<
  | TransactionActivityNotificationInterface
  | CollectibleSoldActivityNotificationInterface
  | CollectiblePurchasedActivityNotificationInterface
  | CollectibleResoldActivityNotificationInterface
  | CollectibleSellOfferActivityNotificationInterface
  | BidMadeActivityNotificationInterface
  | BidReceivedActivityNotificationInterface
  | BidOutbitedActivityNotificationInterface
> => {
  return (data ?? { events: [] }).events
    .filter(x => predicateEventTypeToValidActivityType(x, publicKeyHash))
    .map(x => {
      const { opid, timestamp, type, ophash, amount, buyer_address, seller_address, artist_address, token } = x;
      const baseActivity = {
        id: opid,
        createdAt: timestamp,
        status: StatusType.New,
        title: mapEventTypeToTitle(type ?? ''),
        description: mapEventTypeToDescription(type ?? '')
      };
      if (VALID_ACTIVITIES[ActivityType.Transaction].indexOf(type ?? '') >= 0) {
        return { type: ActivityType.Transaction, ...baseActivity, transactionHash: ophash ?? '#' };
      }
      if (VALID_ACTIVITIES[ActivityType.CollectibleSold].indexOf(type ?? '') >= 0 && publicKeyHash === seller_address) {
        return {
          type: ActivityType.CollectibleSold,
          ...baseActivity,
          transactionAmount: new BigNumber(token?.price ?? 0).div(10 ** 6).toString(),
          buyerAddress: buyer_address ?? '#',
          collectibleName: token?.name ?? 'undefined',
          collectibleMarketplaceUrl: `https://objkt.com/asset/${token?.fa2_address}/${token?.token_id}`,
          creatorAddress: token?.artist_address ?? '',
          creatorMarketplaceUrl: `https://objkt.com/profile/${token?.artist_address ?? ''}/created`,
          marketplaceUrl: 'https://objkt.com/'
        };
      }
      if (
        VALID_ACTIVITIES[ActivityType.CollectibleResold].indexOf(type ?? '') >= 0 &&
        (publicKeyHash === artist_address || publicKeyHash === (token?.artist_address ?? ''))
      ) {
        return {
          type: ActivityType.CollectibleResold,
          ...baseActivity,
          transactionAmount: new BigNumber(token?.price ?? 0).div(10 ** 6).toString(),
          royaltyAmount: new BigNumber(token?.royalties_total ?? 0).div(10 ** 6).toString(),
          buyerAddress: buyer_address ?? '#',
          sellerAddress: seller_address ?? '#',
          collectibleName: token?.name ?? 'undefined',
          collectibleMarketplaceUrl: `https://objkt.com/asset/${token?.fa2_address}/${token?.token_id}`,
          creatorAddress: token?.artist_address ?? '',
          creatorMarketplaceUrl: `https://objkt.com/profile/${token?.artist_address ?? ''}/created`,
          marketplaceUrl: 'https://objkt.com/'
        };
      }
      if (VALID_ACTIVITIES[ActivityType.CollectibleSellOffer].indexOf(type ?? '') >= 0) {
        return {
          type: ActivityType.CollectibleSellOffer,
          ...baseActivity,
          offerAmount: new BigNumber(amount).toString(),
          offerAddress: buyer_address ?? '#',
          collectibleName: token?.name ?? 'undefined',
          collectibleMarketplaceUrl: `https://objkt.com/asset/${token?.fa2_address}/${token?.token_id}`,
          creatorAddress: token?.artist_address ?? '',
          creatorMarketplaceUrl: `https://objkt.com/profile/${seller_address}/created`,
          marketplaceUrl: 'https://objkt.com/'
        };
      }
      return { type: ActivityType.Transaction, ...baseActivity, transactionHash: ophash ?? '#' };
    });
  // .filter(x => x.type === ActivityType.CollectibleSellOffer && x.offerAddress === publicKeyHash);
};

export const mapEventTypeToTitle = (type = ''): string => {
  if (VALID_ACTIVITIES[ActivityType.Transaction].indexOf(type) >= 0) {
    return t('transaction');
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleSellOffer].indexOf(type) >= 0) {
    return t('youReceivedAnOffer');
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleSold].indexOf(type) >= 0) {
    return t('youSoldNft');
  }
  if (VALID_ACTIVITIES[ActivityType.CollectiblePurchased].indexOf(type) >= 0) {
    return t('youBoughtNft');
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleResold].indexOf(type) >= 0) {
    return t('nftWasResold');
  }
  if (VALID_ACTIVITIES[ActivityType.BidMade].indexOf(type) >= 0) {
    return t('youMadeBid');
  }
  if (VALID_ACTIVITIES[ActivityType.BidReceived].indexOf(type) >= 0) {
    return t('youReceivedBid');
  }
  if (VALID_ACTIVITIES[ActivityType.BidOutbited].indexOf(type) >= 0) {
    return t('yourBidWasOutbid');
  }
  return t('topBid');
};

export const mapEventTypeToDescription = (type = ''): string => {
  if (VALID_ACTIVITIES[ActivityType.Transaction].indexOf(type) >= 0) {
    return t('transaction');
  }
  // if(type === 'SET_LEDGER') {
  //     return null
  // }
  return t('topBid');
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

// const VALID_ACTIVITY_TYPES = [
//   'FA2_TRANSFER',
//   //   'HEN_SWAP_V2',
//   'HEN_COLLECT_V2', // sale
//   //   'HEN_CANCEL_SWAP_V2',
//   //   'TEIA_SWAP',
//   'TEIA_COLLECT',
//   //   'TEIA_CANCEL_SWAP',
//   'OBJKT_FULFILL_ASK',
//   'OBJKT_BID',
//   //   'OBJKT_FULFILL_BID',
//   //   'OBJKT_RETRACT_BID',
//   'OBJKT_FULFILL_ASK_V2',
//   'OBJKT_OFFER',
//   'OBJKT_FULFILL_OFFER',
//   'OBJKT_RETRACT_OFFER',
//   'OBJKT_BID_ENGLISH_AUCTION',
//   'OBJKT_CONCLUDE_ENGLISH_AUCTION',
//   'OBJKT_BUY_DUTCH_AUCTION',
//   'OBJKT_CANCEL_DUTCH_AUCTION',
//   'OBJKT_BUY_DUTCH_AUCTION_V2',
//   'OBJKT_SETTLE_ENGLISH_AUCTION',
//   'FX_OFFER',
//   'FX_COLLECT',
//   //   'FX_CANCEL_OFFER',
//   //   'VERSUM_SWAP',
//   //   'VERSUM_COLLECT_SWAP',
//   //   'VERSUM_CANCEL_SWAP',
//   'VERSUM_MAKE_OFFER',
//   'VERSUM_ACCEPT_OFFER'
//   //   'VERSUM_CANCEL_OFFER'
// ];

// TODO: change wrap predicate to mapper to activity type and then predicate in other functions around activity type
export const predicateEventTypeToValidActivityType = (
  {
    type,
    offerAddress,
    buyer_address,
    seller_address,
    artist_address,
    token
  }: {
    type?: string | null;
    offerAddress?: string | null;
    buyer_address?: string | null;
    seller_address?: string | null;
    artist_address?: string | null;
    token?: { artist_address?: string | null } | null;
  },
  publicKeyHash: string
): boolean => {
  if (VALID_ACTIVITIES[ActivityType.Transaction].indexOf(type ?? '') >= 0) {
    return true;
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleSold].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === seller_address) {
      return true;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.CollectiblePurchased].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === buyer_address) {
      return true;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleResold].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === artist_address || publicKeyHash === (token?.artist_address ?? '')) {
      return true;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.CollectibleSellOffer].indexOf(type ?? '') >= 0) {
    if (publicKeyHash !== offerAddress) {
      return true;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.BidMade].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === buyer_address) {
      return true;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.BidReceived].indexOf(type ?? '') >= 0) {
    if (publicKeyHash !== buyer_address) {
      return true;
    }
  }
  //   if (VALID_ACTIVITIES[ActivityType.BidOutbited].indexOf(type ?? '') >= 0) {
  //     return true;
  //   }
  return false;
};
