import { useCallback, useMemo, useState } from 'react';

import { isEqual } from 'lodash';
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

import { useManageableSlugs } from './use-manageable-slugs';
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

  const search = useCallback(
    (slugs: string[]) => searchTezosAssetsWithNoMeta(searchValueDebounced, slugs, getMetadata, getSlugWithChainId),
    [getMetadata, searchValueDebounced]
  );

  // shouldn't resort on balances change
  const enabledSlugsSorted = useMemo(() => [...enabledChainSlugs].sort(sortPredicate), [enabledChainSlugs]);

  const enabledSearchedSlugs = useMemo(
    () => (isInSearchMode ? search(enabledSlugsSorted) : enabledSlugsSorted),
    [isInSearchMode, search, enabledSlugsSorted]
  );

  const manageableChainSlugs = useManageableSlugs(
    manageActive,
    allChainSlugs,
    enabledSlugsSorted,
    enabledSearchedSlugs
  );

  const searchedManageableSlugs = useMemoWithCompare(
    () => (isInSearchMode ? search(manageableChainSlugs) : manageableChainSlugs),
    [isInSearchMode, search, manageableChainSlugs],
    isEqual
  );

  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext
  } = useTezosAccountCollectiblesPaginationLogic(searchedManageableSlugs);

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
