import { VALID_ACTIVITIES } from './const';
import { ActivityType } from './interfaces';

export const predicateEventTypeToValidActivityType = (
  {
    type,
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
    if (publicKeyHash !== buyer_address) {
      return ActivityType.CollectibleSellOffer;
    }
  }
  if (VALID_ACTIVITIES[ActivityType.BidMade].indexOf(type ?? '') >= 0) {
    if (publicKeyHash === buyer_address || publicKeyHash === bidder_address) {
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
