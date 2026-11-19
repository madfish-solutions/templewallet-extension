import { OpenseaNftDetailed } from 'lib/apis/temple/endpoints/evm';
import { fromAssetSlug } from 'lib/assets/utils';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

import { indexCollectibleSlugs, lookupCollectibleSlug, sharedStorefrontCreatorAddress } from './utils';

const storefrontFillCounts = new Map<string, number>();
let storefrontFillGeneration = 0;

const storefrontFillKey = (chainId: number, contractAddress: string) => `${chainId}:${contractAddress.toLowerCase()}`;

/** True while a collection-filtered account request is naming other tokens of this storefront contract. */
export const sharedStorefrontFillInFlight = (chainId: number, contractAddress: string) =>
  (storefrontFillCounts.get(storefrontFillKey(chainId, contractAddress)) ?? 0) > 0;

/** Holds name-only batch requests for this contract until the collection page finishes. */
export const noteSharedStorefrontCollectionLoad = (chainId: number, contractAddress: string) => {
  const key = storefrontFillKey(chainId, contractAddress);
  storefrontFillCounts.set(key, (storefrontFillCounts.get(key) ?? 0) + 1);
};

export const currentSharedStorefrontFillGeneration = () => storefrontFillGeneration;

/** Drops in-flight collection loads so a finished request from the previous list cannot release a newer one. */
export const cancelSharedStorefrontCollectionLoads = () => {
  storefrontFillGeneration += 1;
  storefrontFillCounts.clear();
};

/**
 * Lets remaining nameless storefront tokens be requested again.
 * A generation captured when the load started ignores a release after that load was cancelled.
 */
export const finishSharedStorefrontCollectionLoad = (chainId: number, contractAddress: string, generation?: number) => {
  if (generation !== undefined && generation !== storefrontFillGeneration) return;

  const key = storefrontFillKey(chainId, contractAddress);
  const count = storefrontFillCounts.get(key) ?? 0;
  if (count <= 1) storefrontFillCounts.delete(key);
  else storefrontFillCounts.set(key, count - 1);
};

export interface SharedStorefrontCollectionLoad {
  collection: string;
  contractAddress: string;
}

/**
 * A filtered account request is worth it when the creator still averages more than this many
 * tokens for each collection of theirs we have already seen. Two or fewer fit in the batch.
 */
const STOREFRONT_COLLECTION_MIN_TOKENS_PER_COLLECTION = 2;

interface StorefrontCreatorHoldings {
  contractAddress: string;
  tokenCount: number;
  /** OpenSea collection slugs seen for this creator in the current response. */
  collections: Map<string, number>;
  unnamedOutside: number;
}

const storefrontCreatorKey = (contractAddress: string, creator: string) =>
  `${contractAddress.toLowerCase()}:${creator}`;

/**
 * Collection requests for shared-storefront creators whose tokens concentrate in few collections.
 * Highest tokens-per-collection first. A creator averaging two or fewer is left to the batch.
 */
export const sharedStorefrontCollectionsToLoad = (
  chainId: number,
  nfts: readonly OpenseaNftDetailed[],
  ownedSlugs: readonly string[],
  storedBySlug: StringRecord<EvmCollectibleMetadata> | undefined,
  namedSlugs: ReadonlySet<string>,
  alreadyRequested: ReadonlySet<string>
): SharedStorefrontCollectionLoad[] => {
  const slugIndex = indexCollectibleSlugs(ownedSlugs);
  const receivedSlugs = new Set<string>();
  const holdings = new Map<string, StorefrontCreatorHoldings>();

  for (const slug of ownedSlugs) {
    const [address, tokenId] = fromAssetSlug(slug);
    const creator = sharedStorefrontCreatorAddress(tokenId);
    if (!address || !creator) continue;

    const key = storefrontCreatorKey(address, creator);
    const group = holdings.get(key) ?? {
      contractAddress: address,
      tokenCount: 0,
      collections: new Map(),
      unnamedOutside: 0
    };
    group.tokenCount += 1;
    holdings.set(key, group);
  }

  for (const nft of nfts) {
    const tokenId = String(nft.identifier);
    const creator = sharedStorefrontCreatorAddress(tokenId);
    const collection = nft.collection.trim();
    if (!creator || !collection || alreadyRequested.has(`${chainId}:${collection}`)) continue;

    const slug = lookupCollectibleSlug(slugIndex, nft.contract, tokenId);
    if (!slug) continue;

    receivedSlugs.add(slug);
    const group = holdings.get(storefrontCreatorKey(nft.contract, creator));
    if (!group) continue;

    group.collections.set(collection, (group.collections.get(collection) ?? 0) + 1);
  }

  for (const slug of ownedSlugs) {
    if (receivedSlugs.has(slug) || namedSlugs.has(slug) || storedBySlug?.[slug]?.openseaCollection) continue;

    const [address, tokenId] = fromAssetSlug(slug);
    const creator = sharedStorefrontCreatorAddress(tokenId);
    if (!address || !creator) continue;

    const group = holdings.get(storefrontCreatorKey(address, creator));
    if (group) group.unnamedOutside += 1;
  }

  const byCollection = new Map<string, SharedStorefrontCollectionLoad & { ratio: number; known: number }>();

  for (const group of holdings.values()) {
    const collectionCount = group.collections.size;
    if (!collectionCount || group.unnamedOutside < 1) continue;
    if (group.tokenCount <= collectionCount * STOREFRONT_COLLECTION_MIN_TOKENS_PER_COLLECTION) continue;

    const ratio = group.tokenCount / collectionCount;

    for (const [collection, known] of group.collections) {
      const existing = byCollection.get(collection);
      if (existing && (existing.ratio > ratio || (existing.ratio === ratio && existing.known >= known))) continue;

      byCollection.set(collection, { collection, contractAddress: group.contractAddress, ratio, known });
    }
  }

  return Array.from(byCollection.values())
    .sort((a, b) => b.ratio - a.ratio || b.known - a.known || a.collection.localeCompare(b.collection))
    .map(({ collection, contractAddress }) => ({ collection, contractAddress }));
};
