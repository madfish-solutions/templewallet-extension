import { isSharedStorefrontTokenId } from 'app/store/evm/collectibles-metadata/utils';
import { fromAssetSlug, parseChainAssetSlug } from 'lib/assets/utils';

interface CollectionPlacement {
  collectionSlug: string;
  chainSlugs: readonly string[];
  /** Unnamed OpenSea Shared Storefront group. It stays after every real collection. */
  pinnedToBottom?: boolean;
}

/**
 * Size order, largest first. Equal sizes keep the incoming order.
 * An unnamed OpenSea Shared Storefront group stays after every other collection, still by size.
 */
export const orderCollections = (collections: readonly CollectionPlacement[]): string[] =>
  collections
    .map((collection, index) => ({ collection, index }))
    .toSorted((left, right) => {
      if (left.collection.pinnedToBottom !== right.collection.pinnedToBottom) {
        return left.collection.pinnedToBottom ? 1 : -1;
      }

      return right.collection.chainSlugs.length - left.collection.chainSlugs.length || left.index - right.index;
    })
    .map(({ collection }) => collection.collectionSlug);

/** True when the group is the unnamed remainder of an OpenSea Shared Storefront contract. */
export const isStorefrontPseudocollection = (
  title: string | undefined,
  unknownTitle: string,
  chainSlugs: readonly string[]
) => {
  if (title && title !== unknownTitle) return false;

  return chainSlugs.some(chainSlug => isSharedStorefrontTokenId(fromAssetSlug(parseChainAssetSlug(chainSlug)[2])[1]));
};
