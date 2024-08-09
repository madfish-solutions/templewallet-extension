import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useEvmTokensExchangeRatesLoadingSelector, useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useAllEvmChains } from 'temple/front';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { getSlugWithChainId } from './utils';

export const useEvmAccountTokensListingLogic = (allSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const balancesLoading = useEvmBalancesAreLoading();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const allEvmChains = useAllEvmChains();
  const metadata = useEvmTokensMetadataRecordSelector();

  const getMetadata = useCallback(
    (chainId: number, slug: string) =>
      slug === EVM_TOKEN_SLUG ? allEvmChains[chainId]?.currency : metadata[chainId]?.[slug],
    [allEvmChains, metadata]
  );

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmTokensWithNoMeta(searchValueDebounced, allSlugsSorted, getMetadata, getSlugWithChainId)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, allSlugsSorted, searchValueDebounced, getMetadata]
  );

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;
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
