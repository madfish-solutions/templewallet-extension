import type { ObjktToken } from 'lib/temple/back/web-widgets/objkt-query';

export type CardListingStatus = 'listed' | 'not-listed' | 'auction';

export interface CardState {
  status: CardListingStatus;
  priceTez: number | null;
  priceCurrency: { amount: number; symbol: string } | null;
  editions: number | null;
  type: string | null;
}

const MUTEZ_PER_TEZ = 1_000_000;

const mimeToType = (mime: string | null): string | null => {
  if (!mime) return null;
  if (mime === 'image/gif') return 'gif';
  if (mime.startsWith('video')) return 'video';
  if (mime.startsWith('audio')) return 'audio';
  if (mime.startsWith('model')) return '3D';
  if (mime.startsWith('image')) return 'image';
  return mime;
};

export const deriveCardState = (token: ObjktToken): CardState => {
  const english = token.english_auctions_active[0] ?? null;
  const dutch = token.dutch_auctions_active[0] ?? null;
  const listing = token.listings_active[0] ?? null;

  let status: CardListingStatus;
  let priceTez: number | null = null;
  let priceCurrency: { amount: number; symbol: string } | null = null;

  if (english || dutch) {
    status = 'auction';
    const auctionXtz = english ? (english.highest_bid_xtz ?? english.reserve_xtz) : (dutch?.start_price_xtz ?? null);
    priceTez = auctionXtz != null ? auctionXtz / MUTEZ_PER_TEZ : null;
  } else if (listing) {
    status = 'listed';
    priceTez = listing.price_xtz != null ? listing.price_xtz / MUTEZ_PER_TEZ : null;
    priceCurrency =
      listing.price_xtz == null && listing.currency
        ? { amount: listing.price / 10 ** listing.currency.decimals, symbol: listing.currency.symbol }
        : null;
  } else {
    status = 'not-listed';
  }

  return {
    status,
    priceTez,
    priceCurrency,
    editions: token.supply,
    type: mimeToType(token.mime)
  };
};
