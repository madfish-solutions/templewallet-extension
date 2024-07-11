import { useEffect, useMemo, useRef, useState } from 'react';

import { isEqual, uniq } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { useEnabledTezosAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { useAllTezosAccountCollectiblesSlugs } from 'lib/assets/hooks/collectibles';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useGetCollectibleMetadata, useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { ITEMS_PER_PAGE, useTezosAccountCollectiblesPaginationLogic } from '../use-collectibles-pagination-logic';

import { getSlugWithChainId } from './utils';

export const useTezosAccountCollectiblesListingLogic = (publicKeyHash: string, manageActive = false) => {
  const sortPredicate = useTezosAccountCollectiblesSortPredicate(publicKeyHash);

  const enabledChainSlugs = useEnabledTezosAccountCollectiblesSlugs(publicKeyHash);
  const allChainSlugs = useAllTezosAccountCollectiblesSlugs(publicKeyHash);

  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const metadatasLoading = useCollectiblesMetadataLoadingSelector();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useGetCollectibleMetadata();

  const enabledSlugsSorted = useMemo(() => enabledChainSlugs.sort(sortPredicate), [enabledChainSlugs, sortPredicate]);

  const enabledSearchedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchTezosAssetsWithNoMeta(searchValueDebounced, enabledChainSlugs, getMetadata, getSlugWithChainId)
        : enabledSlugsSorted,
    [isInSearchMode, searchValueDebounced, enabledChainSlugs, getMetadata, enabledSlugsSorted]
  );

  const allChainSlugsRef = useRef(allChainSlugs);
  const enabledChainSlugsSortedRef = useRef(enabledSlugsSorted);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allChainSlugsRef.current = allChainSlugs;
      enabledChainSlugsSortedRef.current = enabledSlugsSorted;
    }
  }, [manageActive, allChainSlugs, enabledSlugsSorted]);

  const manageableTokenSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return enabledSearchedSlugs;

      const allUniqChainSlugs = uniq([...enabledChainSlugsSortedRef.current, ...allChainSlugsRef.current]).filter(
        chainSlug => allChainSlugs.includes(chainSlug)
      );

      return isInSearchMode
        ? searchTezosAssetsWithNoMeta(searchValueDebounced, allUniqChainSlugs, getMetadata, getSlugWithChainId)
        : allUniqChainSlugs;
    },
    [manageActive, enabledSearchedSlugs, isInSearchMode, searchValueDebounced, getMetadata, allChainSlugs],
    isEqual
  );

  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext
  } = useTezosAccountCollectiblesPaginationLogic(manageableTokenSlugs);

  const isSyncing = isInSearchMode ? assetsAreLoading || metadatasLoading : assetsAreLoading || pageIsLoading;

  // In `isInSearchMode === false` there might be a glitch after `assetsAreLoading` & before `pageIsLoading`
  // of `isSyncing === false`. Debouncing to preserve `true` for a while.
  const [isSyncingDebounced] = useDebounce(isSyncing, 500);

  const metaToCheckAndLoad = useMemo(() => {
    // Search is not paginated. This is how all needed meta is loaded
    if (isInSearchMode) return enabledChainSlugs;

    // In pagination, loading meta for the following pages in advance,
    // while not required in current page
    return pageIsLoading ? undefined : enabledChainSlugs.slice(paginatedSlugs.length + ITEMS_PER_PAGE * 2);
  }, [isInSearchMode, pageIsLoading, enabledChainSlugs, paginatedSlugs.length]);

  useTezosCollectiblesMetadataPresenceCheck(metaToCheckAndLoad);

  return {
    isInSearchMode,
    paginatedSlugs,
    isSyncing: isSyncing || isSyncingDebounced,
    loadNext,
    searchValue,
    setSearchValue
  };
};
