import { useCallback, useMemo } from 'react';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { useEvmTokensExchangeRatesLoading, useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAccountTokens, useTezosAccountTokens } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals, useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { useAllEvmChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useGroupedAssetsPaginationLogic } from '../use-group-assets-pagination-logic';
import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { useIsBigBalance } from './use-is-big-balance';
import { getSlugFromChainSlug, useCommonAssetsListingLogic } from './utils';

export const useAccountTokensForListing = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  filterSmallBalances = false,
  groupingEnabled = false
) => {
  const tezTokens = useTezosAccountTokens(accountTezAddress);
  const evmTokens = useEvmAccountTokens(accountEvmAddress);

  const enabledTezChains = useEnabledTezosChains();
  const enabledEvmChains = useEnabledEvmChains();

  const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

  const getTezBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(accountTezAddress);
  const mainnetTezUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  const getBalance = useCallback(
    (chainSlug: string) => {
      const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

      return chainKind === TempleChainKind.Tezos
        ? getTezBalance(chainId as string, slug)
        : getEvmBalance(chainId as number, slug);
    },
    [getEvmBalance, getTezBalance]
  );
  const getExchangeRate = useCallback(
    (chainSlug: string) => {
      const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

      return chainKind === TempleChainKind.Tezos
        ? mainnetTezUsdToTokenRates[slug]
        : evmUsdToTokenRates[chainId as number]?.[slug];
    },
    [evmUsdToTokenRates, mainnetTezUsdToTokenRates]
  );
  const isBigBalance = useIsBigBalance(getBalance, getExchangeRate);

  const gasChainsSlugs = useMemo(
    () => [
      ...enabledTezChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
      ...enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
    ],
    [enabledEvmChains, enabledTezChains]
  );

  const enabledChainsSlugs = useMemo(
    () =>
      gasChainsSlugs
        .concat(
          tezTokens
            .filter(({ status }) => status === 'enabled')
            .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
        )
        .concat(
          evmTokens
            .filter(({ status }) => status === 'enabled')
            .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug))
        ),
    [evmTokens, gasChainsSlugs, tezTokens]
  );

  const enabledChainsSlugsSorted = useMemoWithCompare(() => {
    const enabledChainsSlugsFiltered = filterSmallBalances
      ? enabledChainsSlugs.filter(isBigBalance)
      : enabledChainsSlugs;

    return enabledChainsSlugsFiltered.sort(tokensSortPredicate);
  }, [enabledChainsSlugs, filterSmallBalances, isBigBalance, tokensSortPredicate]);

  const enabledChainsSlugsSortedGrouped = useMemoWithCompare(() => {
    if (!groupingEnabled) return null;

    return groupByToEntries(enabledChainsSlugsSorted, slug => parseChainAssetSlug(slug)[1]);
  }, [enabledChainsSlugsSorted, groupingEnabled]);

  return {
    shouldShowHiddenTokensHint:
      filterSmallBalances && enabledChainsSlugs.length > 0 && enabledChainsSlugsSorted.length === 0,
    enabledChainsSlugsSorted,
    enabledChainsSlugsSortedGrouped,
    tezTokens,
    evmTokens,
    tokensSortPredicate
  };
};

const fallbackAllSlugsSortedGrouped: never[] = [];

export const useAccountTokensListingLogic = (
  allSlugsSorted: string[],
  allSlugsSortedGrouped: ChainGroupedSlugs | null
) => {
  const { slugs: paginatedSlugs, loadNext: loadNextPlain } = useSimpleAssetsPaginationLogic(allSlugsSorted);
  const { slugsGroups: paginatedSlugsGroupsWithFallback, loadNext: loadNextGrouped } = useGroupedAssetsPaginationLogic(
    allSlugsSortedGrouped ?? fallbackAllSlugsSortedGrouped
  );
  const paginatedSlugsGroups = allSlugsSortedGrouped ? paginatedSlugsGroupsWithFallback : null;

  const tezAssetsAreLoading = useAreAssetsLoading('tokens');
  const tezMetadatasLoading = useTokensMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesAreLoading();
  const evmMetadatasLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoading();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    tezAssetsAreLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading || exchangeRatesLoading
  );

  const getTezMetadata = useGetTokenOrGasMetadata();
  const evmChains = useAllEvmChains();
  const evmMetadata = useEvmTokensMetadataRecordSelector();

  const getEvmMetadata = useCallback(
    (chainId: number, slug: string) => {
      if (slug === EVM_TOKEN_SLUG) return evmChains[chainId]?.currency;

      return evmMetadata[chainId]?.[slug];
    },
    [evmChains, evmMetadata]
  );

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            allSlugsSorted,
            getTezMetadata,
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : paginatedSlugs,
    [isInSearchMode, searchValueDebounced, allSlugsSorted, getTezMetadata, getEvmMetadata, paginatedSlugs]
  );
  const displayedGroupedSlugs = useMemo(
    () =>
      isInSearchMode
        ? allSlugsSortedGrouped
            ?.map(([chainId, slugs]): [string | number, string[]] => [
              chainId,
              searchAssetsWithNoMeta(
                searchValueDebounced,
                slugs,
                getTezMetadata,
                getEvmMetadata,
                slug => slug,
                getSlugFromChainSlug
              )
            ])
            .filter(([, slugs]) => slugs.length > 0) ?? null
        : paginatedSlugsGroups,
    [allSlugsSortedGrouped, getEvmMetadata, getTezMetadata, isInSearchMode, paginatedSlugsGroups, searchValueDebounced]
  );

  return {
    isInSearchMode,
    displayedSlugs,
    displayedGroupedSlugs,
    isSyncing,
    loadNextGrouped,
    loadNextPlain,
    searchValue,
    setSearchValue
  };
};
