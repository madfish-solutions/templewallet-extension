import { EvmChainCollectiblesInventory } from './state';

/**
 * Slugs appended after the first inventory page: the next owner page, or a collection card.
 * A refresh replaces the chain with a new first page, and these slugs are copied back onto it.
 * The set lives for the session. Inventory is persisted, so this does not need a migration.
 */
const preservedSlugsByChain = new Map<string, Set<string>>();
/** Slugs on the latest owner page. A refresh that drops one of them does not copy it back. */
const firstPageSlugsByChain = new Map<string, Set<string>>();

const chainKey = (account: string, chainId: number) => `${account}:${chainId}`;

const normalizedSlug = (slug: string) => slug.toLowerCase();

/** Records the owner page a refresh just stored, and stops treating those slugs as later pages. */
export const noteFirstPage = (account: string, chainId: number, slugs: readonly string[]) => {
  const key = chainKey(account, chainId);
  const firstPage = new Set(slugs.map(normalizedSlug));
  firstPageSlugsByChain.set(key, firstPage);

  const preserved = preservedSlugsByChain.get(key);
  if (!preserved) return;

  for (const slug of firstPage) preserved.delete(slug);
};

/** Drops later-page tokens. The next refresh must not copy a list the ownership sample rejected. */
export const forgetPreservedLoadedNfts = (account: string, chainId: number) => {
  const key = chainKey(account, chainId);
  preservedSlugsByChain.delete(key);
  firstPageSlugsByChain.delete(key);
};

export const rememberLoadedBeyondFirstPage = (
  account: string,
  chainId: number,
  slugs: readonly string[],
  /** Tokens already stored. Used once, when this session has not recorded the owner page yet. */
  alreadyLoaded: readonly string[] = []
) => {
  if (!slugs.length) return;

  const key = chainKey(account, chainId);
  let firstPage = firstPageSlugsByChain.get(key);
  if (!firstPage && alreadyLoaded.length) {
    noteFirstPage(account, chainId, alreadyLoaded);
    firstPage = firstPageSlugsByChain.get(key);
  }

  const preserved = preservedSlugsByChain.get(key) ?? new Set<string>();
  let remembered = false;

  for (const slug of slugs) {
    const normalized = normalizedSlug(slug);
    if (firstPage?.has(normalized) || preserved.has(normalized)) continue;

    preserved.add(normalized);
    remembered = true;
  }

  if (remembered) preservedSlugsByChain.set(key, preserved);
};

/**
 * Keeps appended tokens the new first page does not already contain, in their previous order.
 * A token whose contract the new inventory no longer lists stays out.
 */
export const withPreservedLoadedNfts = (
  account: string,
  chainId: number,
  inventory: EvmChainCollectiblesInventory,
  previous: EvmChainCollectiblesInventory | undefined
): EvmChainCollectiblesInventory => {
  noteFirstPage(
    account,
    chainId,
    inventory.loaded.map(nft => nft.slug)
  );

  const key = chainKey(account, chainId);
  const preserved = preservedSlugsByChain.get(key);
  // An empty owner page and an empty contract list means this account no longer has NFTs here.
  // An empty contract list beside a non-empty page is a failed contracts request, so nothing was dropped.
  if (inventory.loaded.length === 0 && inventory.contracts.length === 0) {
    preservedSlugsByChain.delete(key);

    return inventory;
  }
  if (!preserved?.size || !previous?.loaded.length) return inventory;

  const fresh = new Set(inventory.loaded.map(nft => normalizedSlug(nft.slug)));
  const droppedContracts = new Set<string>();
  if (inventory.contracts.length > 0) {
    for (const contract of previous.contracts) droppedContracts.add(contract.address.toLowerCase());
    for (const contract of inventory.contracts) droppedContracts.delete(contract.address.toLowerCase());
  }

  const kept = previous.loaded.filter(nft => {
    const slug = normalizedSlug(nft.slug);
    if (fresh.has(slug) || !preserved.has(slug)) return false;

    return !droppedContracts.has(nft.contractAddress.toLowerCase());
  });
  if (!kept.length) return inventory;

  return {
    ...inventory,
    loaded: inventory.loaded.concat(kept),
    nftPageKey: previous.nftPageKey ?? inventory.nftPageKey
  };
};
