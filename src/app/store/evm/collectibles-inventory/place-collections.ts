import { fromAssetSlug } from 'lib/assets/utils';

export interface InventoryContractRef {
  address: string;
  name?: string;
  distinctTokensOwned: number;
  imageUrl?: string;
}

export interface InventoryCollectionRef {
  slug: string;
  name: string;
  imageUrl?: string;
  /** Distinct NFTs this account owns. Not the collection's total supply. */
  itemCount: number;
  contractAddresses: readonly string[];
}

export interface InventoryLoadedNft {
  slug: string;
  contractAddress: string;
  collectionSlug?: string;
  /** Token balance Alchemy or OpenSea returned for this account. Not a collection count. */
  balance?: string;
  /** Set for a search hit that has not been placed on a stored card. */
  title?: string;
}

interface PlacedInventoryCollection {
  id: string;
  title?: string;
  /** First contract, used as the card's contract identity. */
  contractAddress: string;
  contractAddresses: string[];
  ownedCount: number;
  imageUrl?: string;
  slugs: string[];
}

const normalizeAddress = (address: string) => address.toLowerCase();

/**
 * The image shown on this token's collection card.
 * A collection card uses its own image. A contract card uses the contract image.
 */
export const collectionImageForToken = (
  inventory:
    | {
        contracts: readonly InventoryContractRef[];
        collections: readonly InventoryCollectionRef[];
        loaded: readonly InventoryLoadedNft[];
      }
    | undefined,
  assetSlug: string
) => {
  if (!inventory) return undefined;

  const contractKey = normalizeAddress(fromAssetSlug(assetSlug)[0]);
  const loaded = inventory.loaded.find(nft => nft.slug === assetSlug);
  const onContract = inventory.collections.filter(collection =>
    collection.contractAddresses.some(address => normalizeAddress(address) === contractKey)
  );
  const named = loaded?.collectionSlug
    ? inventory.collections.find(collection => collection.slug === loaded.collectionSlug)
    : onContract.length === 1
      ? onContract[0]
      : undefined;

  if (named) return named.imageUrl;
  if (onContract.length > 0) return undefined;

  return inventory.contracts.find(contract => normalizeAddress(contract.address) === contractKey)?.imageUrl;
};

/**
 * One card per Alchemy contract, until an OpenSea collection names that contract.
 * A collection that spans several contracts is one card. Its count is `itemCount`.
 */
export const placeInventoryCollections = (
  contracts: readonly InventoryContractRef[],
  collections: readonly InventoryCollectionRef[],
  loaded: readonly InventoryLoadedNft[]
): PlacedInventoryCollection[] => {
  const contractsByAddress = new Map(contracts.map(contract => [normalizeAddress(contract.address), contract]));
  const collectionsByAddress = new Map<string, InventoryCollectionRef[]>();

  for (const collection of collections) {
    for (const address of collection.contractAddresses) {
      const key = normalizeAddress(address);
      const group = collectionsByAddress.get(key) ?? [];
      group.push(collection);
      collectionsByAddress.set(key, group);
    }
  }

  const indexesByCollectionSlug = new Map<string, number[]>();
  const unnamedIndexesByAddress = new Map<string, number[]>();
  const indexesByAddress = new Map<string, number[]>();
  const push = (map: Map<string, number[]>, key: string, index: number) => {
    const group = map.get(key);
    if (group) group.push(index);
    else map.set(key, [index]);
  };
  loaded.forEach((nft, index) => {
    const address = normalizeAddress(nft.contractAddress);
    push(indexesByAddress, address, index);
    if (nft.collectionSlug) push(indexesByCollectionSlug, nft.collectionSlug, index);
    else push(unnamedIndexesByAddress, address, index);
  });

  const placedSlugs = new Set<string>();
  const cards: PlacedInventoryCollection[] = [];
  const seenCollectionSlugs = new Set<string>();

  for (const collection of collections) {
    if (seenCollectionSlugs.has(collection.slug)) continue;
    seenCollectionSlugs.add(collection.slug);

    const addresses = collection.contractAddresses.map(normalizeAddress);
    const indexes = new Set(indexesByCollectionSlug.get(collection.slug));
    for (const address of new Set(addresses)) {
      if ((collectionsByAddress.get(address) ?? []).length !== 1) continue;
      for (const index of unnamedIndexesByAddress.get(address) ?? []) indexes.add(index);
    }
    const slugs = Array.from(indexes)
      .sort((a, b) => a - b)
      .map(index => loaded[index].slug);

    for (const slug of slugs) placedSlugs.add(slug);

    cards.push({
      id: `collection:${collection.slug}`,
      title: collection.name,
      contractAddress: addresses[0] ?? '',
      contractAddresses: addresses,
      ownedCount: collection.itemCount,
      imageUrl: collection.imageUrl,
      slugs
    });
  }

  for (const contract of contractsByAddress.values()) {
    const address = normalizeAddress(contract.address);
    if ((collectionsByAddress.get(address) ?? []).length > 0) continue;

    const slugs = (indexesByAddress.get(address) ?? []).flatMap(index =>
      placedSlugs.has(loaded[index].slug) ? [] : [loaded[index].slug]
    );

    cards.push({
      id: `contract:${address}`,
      title: contract.name,
      contractAddress: address,
      contractAddresses: [address],
      ownedCount: contract.distinctTokensOwned,
      imageUrl: contract.imageUrl,
      slugs
    });
  }

  return cards;
};
