import { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useGetCollectibleMetadata, useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { ITEMS_PER_PAGE, useTezosAccountCollectiblesPaginationLogic } from '../use-collectibles-pagination-logic';

import { getSlugWithChainId } from './utils';

export const useTezosAccountCollectiblesListingLogic = (allChainSlugsSorted: string[]) => {
  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext
  } = useTezosAccountCollectiblesPaginationLogic(allChainSlugsSorted);

  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const metadatasLoading = useCollectiblesMetadataLoadingSelector();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const isSyncing = isInSearchMode ? assetsAreLoading || metadatasLoading : assetsAreLoading || pageIsLoading;

  // In `isInSearchMode === false` there might be a glitch after `assetsAreLoading` & before `pageIsLoading`
  // of `isSyncing === false`. Debouncing to preserve `true` for a while.
  const [isSyncingDebounced] = useDebounce(isSyncing, 500);

  const metaToCheckAndLoad = useMemo(() => {
    // Search is not paginated. This is how all needed meta is loaded
    if (isInSearchMode) return allChainSlugsSorted;

    // In pagination, loading meta for the following pages in advance,
    // while not required in current page
    return pageIsLoading ? undefined : allChainSlugsSorted.slice(paginatedSlugs.length + ITEMS_PER_PAGE * 2);
  }, [isInSearchMode, pageIsLoading, allChainSlugsSorted, paginatedSlugs.length]);

  useTezosCollectiblesMetadataPresenceCheck(metaToCheckAndLoad);

  const getCollectibleMeta = useGetCollectibleMetadata();

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchTezosAssetsWithNoMeta(
            searchValueDebounced,
            allChainSlugsSorted,
            (_, slug) => getCollectibleMeta(slug),
            getSlugWithChainId
          )
        : paginatedSlugs,
    [isInSearchMode, searchValueDebounced, allChainSlugsSorted, paginatedSlugs, getCollectibleMeta]
  );

  return {
    isInSearchMode,
    displayedSlugs,
    paginatedSlugs,
    isSyncing: isSyncing || isSyncingDebounced,
    loadNext,
    searchValue,
    setSearchValue
  };
};
