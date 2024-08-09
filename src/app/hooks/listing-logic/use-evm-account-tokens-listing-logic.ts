import { useCallback, useMemo } from 'react';

import { useEvmTokensExchangeRatesLoadingSelector, useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useAllEvmChains } from 'temple/front';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { getSlugWithChainId, useCommonAssetsListingLogic } from './utils';

export const useEvmAccountTokensListingLogic = (allSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const balancesLoading = useEvmBalancesAreLoading();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    balancesLoading || isMetadataLoading || exchangeRatesLoading
  );

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

  return {
    isInSearchMode,
    displayedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
