import { InventoryLoadedNft, placeInventoryCollections } from 'app/store/evm/collectibles-inventory/place-collections';
import { EvmChainCollectiblesInventory, EvmCollectibleSearchHit } from 'app/store/evm/collectibles-inventory/state';
import { toChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { TempleChainKind } from 'temple/types';

import { CollectiblesCollection } from '../types';

interface InventoryCollectionOptions {
  searching: boolean;
  /** Chain slugs that may appear inside a card. Omitted when every loaded token is shown. */
  allowedSlugs?: ReadonlySet<string>;
  extraLoaded?: readonly InventoryLoadedNft[];
}

const chainSlug = (chainId: number, slug: string) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug);

interface CollectionCardSource {
  chainId: number;
  id: string;
  title?: string;
  contractAddress: string;
  contractAddresses: readonly string[];
  ownedCount: number;
  imageUrl?: string;
  slugs: readonly string[];
}

const collectionFromCard = ({
  chainId,
  id,
  title,
  contractAddress,
  contractAddresses,
  ownedCount,
  imageUrl,
  slugs
}: CollectionCardSource): [CollectiblesCollection, string[]] => [
  {
    chainId,
    title,
    logoSources: imageUrl ? [{ urls: [imageUrl] }] : undefined,
    collectionSlug: `evm:${chainId}:${id}`,
    contractSlug: toChainAssetSlug(TempleChainKind.EVM, chainId, toTokenSlug(contractAddress)),
    ownedCount,
    contractAddresses
  },
  slugs.map(slug => chainSlug(chainId, slug))
];

/**
 * Collection cards for one Alchemy chain.
 * A card keeps its owned count when only part of its tokens are loaded.
 * While searching, a card with no matching token is left out.
 */
export const alchemyInventoryCollections = (
  chainId: number,
  inventory: EvmChainCollectiblesInventory,
  { searching, allowedSlugs, extraLoaded = [] }: InventoryCollectionOptions
): Array<[CollectiblesCollection, string[]]> => {
  const loadedSlugs = new Set(inventory.loaded.map(nft => nft.slug));
  const loaded = inventory.loaded.concat(extraLoaded.filter(nft => !loadedSlugs.has(nft.slug)));
  const cards = placeInventoryCollections(inventory.contracts, inventory.collections, loaded);
  const placed = new Set(cards.flatMap(card => card.slugs));
  const entries = cards.flatMap(card => {
    const visible = allowedSlugs ? card.slugs.filter(slug => allowedSlugs.has(chainSlug(chainId, slug))) : card.slugs;
    if (searching && visible.length === 0) return [];

    return [collectionFromCard({ ...card, chainId, slugs: visible })];
  });

  const leftovers = new Map<string, InventoryLoadedNft[]>();

  for (const nft of extraLoaded) {
    if (placed.has(nft.slug)) continue;
    if (allowedSlugs && !allowedSlugs.has(chainSlug(chainId, nft.slug))) continue;

    const key = nft.collectionSlug ?? nft.contractAddress;
    const group = leftovers.get(key) ?? [];
    group.push(nft);
    leftovers.set(key, group);
  }

  for (const [key, nfts] of leftovers) {
    const first = nfts[0];
    if (!first) continue;

    const knownCollection = inventory.collections.find(collection => collection.slug === first.collectionSlug);

    entries.push(
      collectionFromCard({
        chainId,
        id: `search:${key}`,
        title: knownCollection?.name ?? first.title ?? first.collectionSlug,
        contractAddress: first.contractAddress,
        contractAddresses: knownCollection?.contractAddresses ?? [first.contractAddress],
        ownedCount: knownCollection?.itemCount ?? nfts.length,
        imageUrl: knownCollection?.imageUrl,
        slugs: nfts.map(nft => nft.slug)
      })
    );
  }

  return entries;
};

export const loadedNftsFromSearchHits = (hits: readonly EvmCollectibleSearchHit[], chainId: number) =>
  hits.flatMap<InventoryLoadedNft>(hit =>
    hit.chainId === chainId
      ? [
          {
            slug: hit.slug,
            contractAddress: hit.contractAddress,
            collectionSlug: hit.collectionSlug,
            title: hit.title
          }
        ]
      : []
  );
