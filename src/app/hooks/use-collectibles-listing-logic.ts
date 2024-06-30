import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmBalancesLoadingSelector, useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import {
  searchAssetsWithNoMeta,
  searchEvmAssetsWithNoMeta,
  searchEvmChainAssetsWithNoMeta,
  searchTezosAssetsWithNoMeta,
  searchTezosChainAssetsWithNoMeta
} from 'lib/assets/search.utils';
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

const getSlugWithChainId = <T>(chainSlug: string) => {
  const [_, chainId, assetSlug] = fromChainAssetSlug<T>(chainSlug);

  return { chainId, assetSlug };
};

const getSlugFromChainSlug = (chainSlug: string) => getSlugWithChainId(chainSlug).assetSlug;

export const useAccountCollectiblesListingLogic = (allChainSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(allChainSlugsSorted);

  const evmMetadata = useEvmCollectiblesMetadataRecordSelector();

  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const tezMetadatasLoading = useCollectiblesMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const EvmMetadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = tezAssetsLoading || tezMetadatasLoading || evmBalancesLoading || EvmMetadatasLoading;

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getTezMetadata = useGetCollectibleMetadata();

  const getEvmMetadata = useCallback((chainId: number, slug: string) => evmMetadata[chainId]?.[slug], [evmMetadata]);

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            allChainSlugsSorted,
            (_, slug) => getTezMetadata(slug),
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : paginatedSlugs,
    [isInSearchMode, searchValueDebounced, allChainSlugsSorted, getTezMetadata, getEvmMetadata, paginatedSlugs]
  );

  return {
    isInSearchMode,
    displayedSlugs,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};

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
        ? searchTezosAssetsWithNoMeta(
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
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getCollectibleMeta, slug => slug)
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

export const useEvmAccountCollectiblesListingLogic = (allChainSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(allChainSlugsSorted);

  const metadata = useEvmCollectiblesMetadataRecordSelector();

  const balancesLoading = useEvmBalancesLoadingSelector();
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = balancesLoading || metadatasLoading;

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useCallback((chainId: number, slug: string) => metadata[chainId]?.[slug], [metadata]);

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmAssetsWithNoMeta(searchValueDebounced, allChainSlugsSorted, getMetadata, getSlugWithChainId)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, searchValueDebounced, allChainSlugsSorted, getMetadata]
  );

  return {
    displayedSlugs,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};

export const useEvmChainCollectiblesListingLogic = (allSlugsSorted: string[], chainId: number) => {
  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(allSlugsSorted);

  const metadata = useEvmCollectiblesMetadataRecordSelector();

  const balancesLoading = useEvmBalancesLoadingSelector();
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = balancesLoading || metadatasLoading;

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useCallback((slug: string) => metadata[chainId]?.[slug], [metadata, chainId]);

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmChainAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getMetadata, slug => slug)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, searchValueDebounced, allSlugsSorted, getMetadata]
  );

  return {
    displayedSlugs,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
