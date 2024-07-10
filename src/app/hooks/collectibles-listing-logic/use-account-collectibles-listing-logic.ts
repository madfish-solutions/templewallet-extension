import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmBalancesLoadingSelector, useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useGetCollectibleMetadata } from 'lib/metadata';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getSlugFromChainSlug } from './utils';

export const useAccountCollectiblesListingLogic = (allChainSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allChainSlugsSorted);

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
