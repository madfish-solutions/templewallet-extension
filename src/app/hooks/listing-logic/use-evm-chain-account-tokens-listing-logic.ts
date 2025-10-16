import { useCallback, useMemo } from 'react';

import {
  useEvmChainBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoading,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useEvmChainUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmChainAccountTokens } from 'lib/assets/hooks/tokens';
import { searchEvmChainTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmChainTokensSortPredicate } from 'lib/assets/use-sorting';
import { useGetEvmChainTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEvmChainByChainId } from 'temple/front/chains';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useIsBigBalance } from './use-is-big-balance';
import { useCommonAssetsListingLogic } from './utils';

export const useEvmChainAccountTokensForListing = (
  publicKeyHash: HexString,
  chainId: number,
  filterSmallBalances: boolean
) => {
  const getBalance = useGetEvmChainTokenBalanceWithDecimals(publicKeyHash, chainId);
  const usdToTokenRates = useEvmChainUsdToTokenRatesSelector(chainId);
  const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

  const tokens = useEvmChainAccountTokens(publicKeyHash, chainId);

  const getExchangeRate = useCallback((slug: string) => usdToTokenRates[slug], [usdToTokenRates]);
  const isBigBalance = useIsBigBalance(getBalance, getExchangeRate);

  const enabledSlugs = useMemo(() => {
    const gasTokensSlugs: string[] = [EVM_TOKEN_SLUG];
    return gasTokensSlugs.concat(tokens.filter(({ status }) => status === 'enabled').map(({ slug }) => slug));
  }, [tokens]);

  const enabledSlugsSorted = useMemoWithCompare(() => {
    const enabledSlugsFiltered = filterSmallBalances ? enabledSlugs.filter(isBigBalance) : enabledSlugs;

    return enabledSlugsFiltered.sort(tokensSortPredicate);
  }, [enabledSlugs, filterSmallBalances, isBigBalance, tokensSortPredicate]);

  return {
    shouldShowHiddenTokensHint: filterSmallBalances && enabledSlugs.length > 0 && enabledSlugsSorted.length === 0,
    enabledSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};

export const useEvmChainAccountTokensListingLogic = (allSlugsSorted: string[], chainId: number) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const balancesLoading = useEvmChainBalancesLoadingSelector(chainId);
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoading();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    balancesLoading || isMetadataLoading || exchangeRatesLoading
  );

  const chain = useEvmChainByChainId(chainId);
  const metadata = useEvmTokensMetadataRecordSelector();

  const getMetadata = useCallback(
    (slug: string) => {
      if (slug === EVM_TOKEN_SLUG) return chain?.currency;

      return metadata[chainId]?.[slug];
    },
    [chain, metadata, chainId]
  );

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmChainTokensWithNoMeta(searchValueDebounced, allSlugsSorted, getMetadata, slug => slug)
        : paginatedSlugs,
    [paginatedSlugs, allSlugsSorted, isInSearchMode, getMetadata, searchValueDebounced]
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
