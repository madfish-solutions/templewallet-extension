import { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAssetsMetadataWithPresenceCheck } from 'lib/metadata';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { ITEMS_PER_PAGE, useCollectiblesPaginationLogic } from './use-collectibles-pagination-logic';

export const useCollectiblesListingLogic = (allSlugsSorted: string[]) => {
  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext,
    seedForLoadNext
  } = useCollectiblesPaginationLogic(allSlugsSorted);

  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const tokensMetadataLoading = useTokensMetadataLoadingSelector();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const isSyncing = isInSearchMode ? assetsAreLoading || tokensMetadataLoading : assetsAreLoading || pageIsLoading;

  const metaToCheckAndLoad = useMemo(() => {
    // Search is not paginated. This is how all needed meta is loaded
    if (isInSearchMode) return allSlugsSorted;

    // In pagination, loading meta for the following pages in advance,
    // while not required in current page
    return pageIsLoading ? undefined : allSlugsSorted.slice(paginatedSlugs.length + ITEMS_PER_PAGE * 2);
  }, [isInSearchMode, pageIsLoading, allSlugsSorted, paginatedSlugs.length]);

  const allTokensMetadata = useAssetsMetadataWithPresenceCheck(metaToCheckAndLoad);

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, allTokensMetadata, slug => slug)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, searchValueDebounced, allSlugsSorted, allTokensMetadata]
  );

  return {
    isInSearchMode,
    displayedSlugs,
    paginatedSlugs,
    isSyncing,
    loadNext,
    seedForLoadNext,
    searchValue,
    setSearchValue
  };
};
