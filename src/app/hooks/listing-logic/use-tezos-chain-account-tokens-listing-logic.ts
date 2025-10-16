import { useCallback, useMemo } from 'react';

import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEMPLE_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosChainAccountTokens } from 'lib/assets/hooks/tokens';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { useGetTezosChainAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useIsBigBalance } from './use-is-big-balance';
import { useCommonAssetsListingLogic } from './utils';

export const useTezosChainAccountTokensForListing = (publicKeyHash: string, chainId: string) => {
  const { hideSmallBalance: filterSmallBalances } = useTokensListOptionsSelector();
  const getBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(publicKeyHash, chainId);
  const mainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const leadingTokensSlugs = useMemo(() => (chainId === TEZOS_MAINNET_CHAIN_ID ? [TEMPLE_TOKEN_SLUG] : []), [chainId]);

  const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, chainId);

  const tokens = useTezosChainAccountTokens(publicKeyHash, chainId);

  const getUsdToTokenRate = useCallback((slug: string) => mainnetUsdToTokenRates[slug], [mainnetUsdToTokenRates]);
  const isBigBalance = useIsBigBalance(getBalance, getUsdToTokenRate);

  const leadingTokensFiltered = useMemoWithCompare(
    () =>
      filterSmallBalances && leadingTokensSlugs.length ? leadingTokensSlugs.filter(isBigBalance) : leadingTokensSlugs,
    [filterSmallBalances, leadingTokensSlugs, isBigBalance]
  );

  const nonLeadingTokensSlugs = useMemo(() => {
    const gasSlugs: string[] = [TEZ_TOKEN_SLUG];

    return gasSlugs.concat(tokens.filter(({ status }) => status === 'enabled').map(({ slug }) => slug));
  }, [tokens]);

  const nonLeadingTokenSlugsFilteredSorted = useMemoWithCompare(() => {
    const nonLeadingTokensSlugsFiltered = filterSmallBalances
      ? nonLeadingTokensSlugs.filter(isBigBalance)
      : nonLeadingTokensSlugs;

    return nonLeadingTokensSlugsFiltered.sort(tokensSortPredicate);
  }, [filterSmallBalances, isBigBalance, nonLeadingTokensSlugs, tokensSortPredicate]);

  const enabledTokenSlugsSorted = useMemo(
    () => Array.from(new Set(leadingTokensFiltered.concat(nonLeadingTokenSlugsFilteredSorted))),
    [leadingTokensFiltered, nonLeadingTokenSlugsFilteredSorted]
  );

  const unfilteredTokensCount = useMemo(
    () => Array.from(new Set(leadingTokensSlugs.concat(nonLeadingTokensSlugs))).length,
    [leadingTokensSlugs, nonLeadingTokensSlugs]
  );

  return {
    shouldShowHiddenTokensHint:
      filterSmallBalances && unfilteredTokensCount > 0 && enabledTokenSlugsSorted.length === 0,
    enabledTokenSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};

export const useTezosChainAccountTokensListingLogic = (allSlugsSorted: string[], chainId: string) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    assetsAreLoading || metadatasLoading
  );

  const getTokenMetadata = useGetChainTokenOrGasMetadata(chainId);

  const displayedSlugs = useMemoWithCompare(
    () =>
      isInSearchMode
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getTokenMetadata, slug => slug)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, allSlugsSorted, getTokenMetadata, searchValueDebounced]
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
