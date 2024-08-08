import { useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getSlugWithChainId } from './utils';

export const useTezosAccountTokensListingLogic = (allSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();

  const getMetadata = useGetTokenOrGasMetadata();

  const displayedSlugs = useMemoWithCompare(
    () =>
      isInSearchMode
        ? searchTezosAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getMetadata, getSlugWithChainId)
        : paginatedSlugs,
    [isInSearchMode, allSlugsSorted, paginatedSlugs, getMetadata, searchValueDebounced]
  );

  const isSyncing = assetsAreLoading || metadatasLoading;
  const [isSyncingDebounced] = useDebounce(isSyncing, 500);

  return {
    isInSearchMode,
    displayedSlugs,
    isSyncing: isSyncing || isSyncingDebounced,
    loadNext,
    searchValue,
    setSearchValue
  };
};
