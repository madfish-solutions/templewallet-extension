import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { useTezosChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useTezosChainCollectiblesMetadataPresenceCheck, useGetCollectibleMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { TezosNetworkEssentials } from 'temple/networks';

import { ITEMS_PER_PAGE, useTezosChainCollectiblesPaginationLogic } from '../use-collectibles-pagination-logic';

import { useManageableSlugs } from './use-manageable-slugs';

export const useTezosChainCollectiblesListingLogic = (
  publicKeyHash: string,
  network: TezosNetworkEssentials,
  manageActive = false
) => {
  const { chainId } = network;

  const sortPredicate = useTezosChainCollectiblesSortPredicate(publicKeyHash, chainId);

  const allChainAccountCollectibles = useTezosChainAccountCollectibles(publicKeyHash, chainId);

  const allSlugs = useMemo(() => allChainAccountCollectibles.map(({ slug }) => slug), [allChainAccountCollectibles]);

  const enabledSlugs = useMemo(
    () => allChainAccountCollectibles.filter(({ status }) => status === 'enabled').map(({ slug }) => slug),
    [allChainAccountCollectibles]
  );

  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const metadatasLoading = useCollectiblesMetadataLoadingSelector();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useGetCollectibleMetadata();

  const search = useCallback(
    (slugs: string[]) => searchTezosChainAssetsWithNoMeta(searchValueDebounced, slugs, getMetadata, slug => slug),
    [getMetadata, searchValueDebounced]
  );

  const enabledSlugsSorted = useMemo(() => [...enabledSlugs].sort(sortPredicate), [enabledSlugs, sortPredicate]);

  const enabledSearchedSlugs = useMemo(
    () => (isInSearchMode ? search(enabledSlugsSorted) : enabledSlugsSorted),
    [isInSearchMode, search, enabledSlugsSorted]
  );

  const manageableSlugs = useManageableSlugs(manageActive, allSlugs, enabledSlugsSorted, enabledSearchedSlugs);

  const searchedManageableSlugs = useMemoWithCompare(
    () => (isInSearchMode ? search(manageableSlugs) : manageableSlugs),
    [isInSearchMode, search, manageableSlugs]
  );

  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext
  } = useTezosChainCollectiblesPaginationLogic(searchedManageableSlugs, network.rpcBaseURL);

  const metaToCheckAndLoad = useMemo(() => {
    // Search is not paginated. This is how all needed meta is loaded
    if (isInSearchMode) return enabledSlugs;

    // In pagination, loading meta for the following pages in advance,
    // while not required in current page
    return pageIsLoading ? undefined : enabledSlugs.slice(paginatedSlugs.length + ITEMS_PER_PAGE * 2);
  }, [isInSearchMode, pageIsLoading, enabledSlugs, paginatedSlugs.length]);

  useTezosChainCollectiblesMetadataPresenceCheck(network.rpcBaseURL, metaToCheckAndLoad);

  const isSyncing = isInSearchMode ? assetsAreLoading || metadatasLoading : assetsAreLoading || pageIsLoading;

  // In `isInSearchMode === false` there might be a glitch after `assetsAreLoading` & before `pageIsLoading`
  // of `isSyncing === false`. Debouncing to preserve `true` for a while.
  const [isSyncingDebounced] = useDebounce(isSyncing, 500);

  return {
    isInSearchMode,
    paginatedSlugs,
    isSyncing: isSyncing || isSyncingDebounced,
    loadNext,
    searchValue,
    setSearchValue
  };
};
