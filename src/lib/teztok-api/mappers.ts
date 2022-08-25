import BigNumber from 'bignumber.js';

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
  LatestEventsQuery,
  StatusType,
  TransactionActivityNotificationInterface
} from './interfaces';
import { predicateEventTypeToValidActivityType } from './util';

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
