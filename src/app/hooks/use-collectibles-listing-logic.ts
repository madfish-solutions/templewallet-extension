import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useEvmBalancesLoadingSelector, useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { searchAssetsWithNoMeta, searchChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { fromChainAssetSlug } from 'lib/assets/utils';
import {
  useTezosChainCollectiblesMetadataPresenceCheck,
  useGetCollectibleMetadata,
  useTezosCollectiblesMetadataPresenceCheck
} from 'lib/metadata';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { TezosNetworkEssentials } from 'temple/networks';

import {
  ITEMS_PER_PAGE,
  useTezosAccountCollectiblesPaginationLogic,
  useTezosChainCollectiblesPaginationLogic
} from './use-collectibles-pagination-logic';
import { useEvmAssetsPaginationLogic } from './use-evm-assets-pagination-logic';

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

  const getSlugWithChainId = useCallback((chainSlug: string) => {
    const [_, chainId, assetSlug] = fromChainAssetSlug<string>(chainSlug);

    return { chainId, assetSlug };
  }, []);

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            allChainSlugsSorted,
            (_, slug) => getCollectibleMeta(slug),
            getSlugWithChainId
          )
        : paginatedSlugs,
    [isInSearchMode, searchValueDebounced, allChainSlugsSorted, getSlugWithChainId, paginatedSlugs, getCollectibleMeta]
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

export const useTezosChainCollectiblesListingLogic = (network: TezosNetworkEssentials, allSlugsSorted: string[]) => {
  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext
  } = useTezosChainCollectiblesPaginationLogic(allSlugsSorted, network.rpcBaseURL);

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
    if (isInSearchMode) return allSlugsSorted;

    // In pagination, loading meta for the following pages in advance,
    // while not required in current page
    return pageIsLoading ? undefined : allSlugsSorted.slice(paginatedSlugs.length + ITEMS_PER_PAGE * 2);
  }, [isInSearchMode, pageIsLoading, allSlugsSorted, paginatedSlugs.length]);

  useTezosChainCollectiblesMetadataPresenceCheck(network.rpcBaseURL, metaToCheckAndLoad);

  const getCollectibleMeta = useGetCollectibleMetadata();

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchChainAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getCollectibleMeta, slug => slug)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, searchValueDebounced, allSlugsSorted, getCollectibleMeta]
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

export const useEvmCollectiblesListingLogic = (allSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(allSlugsSorted);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = balancesLoading || metadatasLoading;

  return {
    paginatedSlugs,
    isSyncing,
    loadNext
  };
};

export const useAccountCollectiblesListingLogic = (allChainSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(allChainSlugsSorted);

  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const tezMetadatasLoading = useCollectiblesMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const EvmMetadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = tezAssetsLoading || tezMetadatasLoading || evmBalancesLoading || EvmMetadatasLoading;

  return {
    paginatedSlugs,
    isSyncing,
    loadNext
  };
};
