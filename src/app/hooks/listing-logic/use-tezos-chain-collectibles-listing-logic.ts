import { useMemo } from 'react';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainCollectiblesMetadataPresenceCheck, useGetCollectibleMetadata } from 'lib/metadata';
import { TezosNetworkEssentials } from 'temple/networks';

import { ITEMS_PER_PAGE, useTezosChainCollectiblesPaginationLogic } from '../use-collectibles-pagination-logic';

import { useCommonAssetsListingLogic } from './utils';

export const useTezosChainCollectiblesListingLogic = (allSlugsSorted: string[], network: TezosNetworkEssentials) => {
  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext
  } = useTezosChainCollectiblesPaginationLogic(allSlugsSorted, network.rpcBaseURL);

  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const metadatasLoading = useCollectiblesMetadataLoadingSelector();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    isInSearchMode => (isInSearchMode ? assetsAreLoading || metadatasLoading : assetsAreLoading || pageIsLoading)
  );

  const metaToCheckAndLoad = useMemo(() => {
    // Search is not paginated. This is how all needed meta is loaded
    if (isInSearchMode) return allSlugsSorted;

    // In pagination, loading meta for the following pages in advance,
    // while not required in current page
    return pageIsLoading ? undefined : allSlugsSorted.slice(paginatedSlugs.length + ITEMS_PER_PAGE * 2);
  }, [isInSearchMode, pageIsLoading, allSlugsSorted, paginatedSlugs.length]);

  useTezosChainCollectiblesMetadataPresenceCheck(network.rpcBaseURL, metaToCheckAndLoad);

  const getCollectibleMetadata = useGetCollectibleMetadata();

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getCollectibleMetadata, slug => slug)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, searchValueDebounced, allSlugsSorted, getCollectibleMetadata]
  );

  return {
    isInSearchMode,
    displayedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
