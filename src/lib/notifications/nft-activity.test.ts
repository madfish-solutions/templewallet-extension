import { formatNftActivityCounts, getNftActivityCounts } from './nft-activity';
import { NotificationType } from './notification-type';

describe('nft activity popup summary', () => {
  it('counts offers, bids and sales', () => {
    expect(
      getNftActivityCounts([
        { type: NotificationType.OfferReceived },
        { type: NotificationType.OfferReceived },
        { type: NotificationType.OfferReceived },
        { type: NotificationType.AuctionBid },
        { type: NotificationType.AuctionBid },
        { type: NotificationType.NftSold },
        { type: NotificationType.NftSold }
      ])
    ).toEqual({ offers: 3, bids: 2, sales: 2 });
  });

  it('formats only non-zero activity types in offers-bids-sales order', () => {
    expect(
      formatNftActivityCounts({ offers: 3, bids: 2, sales: 2 }, (keyPrefix, count) => `${count} ${keyPrefix}`)
    ).toBe('3 nftActivityOffers · 2 nftActivityBids · 2 nftActivitySales');
    expect(
      formatNftActivityCounts({ offers: 2, bids: 0, sales: 1 }, (keyPrefix, count) => `${count} ${keyPrefix}`)
    ).toBe('2 nftActivityOffers · 1 nftActivitySales');
  });
});
