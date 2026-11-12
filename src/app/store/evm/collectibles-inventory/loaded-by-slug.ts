import { useSelector } from 'app/store/root-state.selector';

import { InventoryLoadedNft } from './place-collections';

const loadedIndexes = new WeakMap<readonly InventoryLoadedNft[], ReadonlyMap<string, InventoryLoadedNft>>();

/** One index per `loaded` array. Later lookups of that same array do not scan it again. */
export const loadedNftsBySlug = (loaded: readonly InventoryLoadedNft[]) => {
  const cached = loadedIndexes.get(loaded);
  if (cached) return cached;

  const index = new Map<string, InventoryLoadedNft>();
  for (const nft of loaded) index.set(nft.slug.toLowerCase(), nft);
  loadedIndexes.set(loaded, index);

  return index;
};

export const useEvmLoadedNftSelector = (account: HexString | undefined, chainId: number, assetSlug: string) =>
  useSelector(state => {
    if (!account) return undefined;

    const loaded = state.evmCollectiblesInventory.byAccount[account]?.[chainId]?.loaded;
    if (!loaded) return undefined;

    return loadedNftsBySlug(loaded).get(assetSlug.toLowerCase());
  });
