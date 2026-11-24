interface AlchemyOwnerPage {
  ownedNfts: readonly unknown[];
  totalCount: number;
  pageKey?: string | null;
}

interface AlchemyOwnerScan {
  /** NFTs already returned by earlier pages of this same query. */
  receivedCount: number;
  /**
   * `totalCount` from the previous page. The first page passes its own `totalCount`, so one
   * cursor page is not treated as a jump.
   */
  previousTotalCount: number;
}

/**
 * An empty page with a `pageKey` is a normal cursor step. The query is unusable when no NFT has
 * arrived and `totalCount` changed, or when the cursor ends with a positive `totalCount` and no NFTs.
 * `totalCount` is the number of matches for the query. A later change after NFTs have arrived is kept.
 */
export const isUnusableAlchemyOwnerPage = (page: AlchemyOwnerPage, scan: AlchemyOwnerScan) => {
  if (scan.receivedCount + page.ownedNfts.length > 0) return false;
  if (page.totalCount !== scan.previousTotalCount) return true;

  return !page.pageKey && page.totalCount > 0;
};

/** `evm:<chainId>:collection:<opensea slug>` from an inventory card. A contract card has none. */
export const openseaCollectionSlugFromCard = (cardSlug: string | undefined) => {
  if (!cardSlug?.startsWith('evm:')) return undefined;

  const marker = ':collection:';
  const index = cardSlug.indexOf(marker);
  if (index === -1) return undefined;

  return cardSlug.slice(index + marker.length) || undefined;
};
