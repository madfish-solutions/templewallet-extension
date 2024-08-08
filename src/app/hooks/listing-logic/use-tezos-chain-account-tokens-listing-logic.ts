import { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

export const useTezosChainAccountTokensListingLogic = (allSlugsSorted: string[], chainId: string) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getTokenMetadata = useGetChainTokenOrGasMetadata(chainId);

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getTokenMetadata, slug => slug)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, allSlugsSorted, getTokenMetadata, searchValueDebounced]
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
