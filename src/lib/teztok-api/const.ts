import { ActivityType } from './interfaces';

export const VALID_ACTIVITIES: Record<ActivityType, Array<string>> = {
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
    'FX_LISTING_ACCEPT',
    'FX_OFFER_ACCEPT_V3',
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
    'FX_LISTING_ACCEPT',
    'FX_OFFER_ACCEPT_V3',
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
    'FX_LISTING_ACCEPT',
    'FX_OFFER_ACCEPT_V3',
    'VERSUM_ACCEPT_OFFER'
  ],
  [ActivityType.CollectibleSellOffer]: ['OBJKT_OFFER', 'FX_OFFER', 'VERSUM_MAKE_OFFER'],
  [ActivityType.BidMade]: ['OBJKT_BID', 'OBJKT_BID_ENGLISH_AUCTION', 'OBJKT_BID_ENGLISH_AUCTION_V2'],
  [ActivityType.BidReceived]: ['OBJKT_BID', 'OBJKT_BID_ENGLISH_AUCTION', 'OBJKT_BID_ENGLISH_AUCTION_V2'],
  [ActivityType.BidOutbited]: []
};
