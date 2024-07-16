import { useEffect, useMemo, useRef, useState } from 'react';

import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { useEnabledTezosChainAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { useAllTezosChainAccountCollectiblesSlugs } from 'lib/assets/hooks/collectibles';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useTezosChainCollectiblesMetadataPresenceCheck, useGetCollectibleMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { TezosNetworkEssentials } from 'temple/networks';

import { ITEMS_PER_PAGE, useTezosChainCollectiblesPaginationLogic } from '../use-collectibles-pagination-logic';

export const useTezosChainCollectiblesListingLogic = (
  publicKeyHash: string,
  network: TezosNetworkEssentials,
  manageActive = false
) => {
  const { chainId } = network;

  const sortPredicate = useTezosChainCollectiblesSortPredicate(publicKeyHash, chainId);

  const enabledSlugs = useEnabledTezosChainAccountCollectiblesSlugs(publicKeyHash, chainId);
  const allSlugs = useAllTezosChainAccountCollectiblesSlugs(publicKeyHash, chainId);

  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const metadatasLoading = useCollectiblesMetadataLoadingSelector();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useGetCollectibleMetadata();

  const enabledSlugsSorted = useMemo(() => enabledSlugs.sort(sortPredicate), [enabledSlugs, sortPredicate]);

  const enabledSearchedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, enabledSlugs, getMetadata, slug => slug)
        : enabledSlugsSorted,
    [isInSearchMode, searchValueDebounced, enabledSlugs, getMetadata, enabledSlugsSorted]
  );

  const allSlugsRef = useRef(allSlugs);
  const enabledSlugsSortedRef = useRef(enabledSlugsSorted);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allSlugsRef.current = allSlugs;
      enabledSlugsSortedRef.current = enabledSlugsSorted;
    }
  }, [manageActive, allSlugs, enabledSlugsSorted]);

  const manageableSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return enabledSearchedSlugs;

      const allSlugsSet = new Set(allSlugs);
      const allUniqSlugsSet = new Set(enabledSlugsSortedRef.current.concat(allSlugsRef.current));

      const allUniqSlugsWithoutDeleted = Array.from(allUniqSlugsSet).filter(slug => allSlugsSet.has(slug));

      return isInSearchMode
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, allUniqSlugsWithoutDeleted, getMetadata, slug => slug)
        : allUniqSlugsWithoutDeleted;
    },
    [manageActive, enabledSearchedSlugs, isInSearchMode, searchValueDebounced, getMetadata, allSlugs],
    isEqual
  );

  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext
  } = useTezosChainCollectiblesPaginationLogic(manageableSlugs, network.rpcBaseURL);

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
