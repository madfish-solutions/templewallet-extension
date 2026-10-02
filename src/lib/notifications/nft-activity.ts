import { NotificationType } from './notification-type';

export const ACCOUNT_NOTIFICATION_POPUP_DURATION_MS = 3_000;

export interface NftActivityCounts {
  offers: number;
  bids: number;
  sales: number;
}

export const getNftActivityCounts = (notifications: Array<{ type: NotificationType }>): NftActivityCounts => {
  const counts: NftActivityCounts = { offers: 0, bids: 0, sales: 0 };

  for (const notification of notifications) {
    switch (notification.type) {
      case NotificationType.OfferReceived:
        counts.offers++;
        break;
      case NotificationType.AuctionBid:
        counts.bids++;
        break;
      case NotificationType.NftSold:
        counts.sales++;
        break;
    }
  }

  return counts;
};

export const formatNftActivityCounts = (
  counts: NftActivityCounts,
  formatPart: (keyPrefix: 'nftActivityOffers' | 'nftActivityBids' | 'nftActivitySales', count: number) => string
) => {
  const parts: string[] = [];

  if (counts.offers > 0) {
    parts.push(formatPart('nftActivityOffers', counts.offers));
  }
  if (counts.bids > 0) {
    parts.push(formatPart('nftActivityBids', counts.bids));
  }
  if (counts.sales > 0) {
    parts.push(formatPart('nftActivitySales', counts.sales));
  }

  return parts.join(' · ');
};
