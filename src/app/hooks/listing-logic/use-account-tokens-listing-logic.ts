import { useEvmTokensExchangeRatesLoading, useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAccountTokens, useTezosAccountTokens } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmGasOrTokenMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useGroupedAssetsPaginationLogic } from '../use-group-assets-pagination-logic';
import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { useIsMultichainBigBalance } from './use-is-big-balance';
import { useNetworksForChainSlugs } from './use-networks-for-chain-slugs';
import { useSelectedChainsTokensSlugs } from './use-selected-chains-tokens-slugs';
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

  const isBigBalance = useIsMultichainBigBalance(accountTezAddress, accountEvmAddress);

  const enabledChainsSlugs = enabledTezChains
    .map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG))
    .concat(enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)));

  for (const { chainId, slug, status } of tezTokens) {
    if (status === 'enabled') {
      enabledChainsSlugs.push(toChainAssetSlug(TempleChainKind.Tezos, chainId, slug));
    }
  }

  for (const { chainId, slug, status } of evmTokens) {
    if (status === 'enabled') {
      enabledChainsSlugs.push(toChainAssetSlug(TempleChainKind.EVM, chainId, slug));
    }
  }

  const enabledChainsSlugsSorted = useMemoWithCompare(() => {
    const enabledChainsSlugsFiltered = filterSmallBalances
      ? enabledChainsSlugs.filter(isBigBalance)
      : enabledChainsSlugs;

    return enabledChainsSlugsFiltered.toSorted(tokensSortPredicate);
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

export const useAccountTokensListingLogic = (
  allSlugsSorted: string[],
  allSlugsSortedGrouped: ChainGroupedSlugs | null,
  ignoreSearch = false
) => {
  const { selectedChainsSlugsSorted, selectedChainsSlugsSortedGrouped } = useSelectedChainsTokensSlugs(
    allSlugsSorted,
    allSlugsSortedGrouped
  );
  const applicableNetworks = useNetworksForChainSlugs(allSlugsSorted);
  const { slugs: paginatedSlugs, loadNext: loadNextPlain } = useSimpleAssetsPaginationLogic(selectedChainsSlugsSorted);
  const { slugsGroups: paginatedSlugsGroupsWithFallback, loadNext: loadNextGrouped } = useGroupedAssetsPaginationLogic(
    selectedChainsSlugsSortedGrouped ?? EMPTY_FROZEN_ARRAY
  );
  const paginatedSlugsGroups = selectedChainsSlugsSortedGrouped ? paginatedSlugsGroupsWithFallback : null;

  const tezAssetsAreLoading = useAreAssetsLoading('tokens');
  const tezMetadatasLoading = useTokensMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesAreLoading();
  const evmMetadatasLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoading();

  const { searchValueDebounced, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    tezAssetsAreLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading || exchangeRatesLoading
  );

  const getTezMetadata = useGetTokenOrGasMetadata();
  const getEvmMetadata = useGetEvmGasOrTokenMetadata();

  const displayedSlugs =
    isInSearchMode && !ignoreSearch
      ? searchAssetsWithNoMeta(
          searchValueDebounced,
          selectedChainsSlugsSorted,
          getTezMetadata,
          getEvmMetadata,
          slug => slug,
          getSlugFromChainSlug
        )
      : paginatedSlugs;
  let displayedGroupedSlugs: ChainGroupedSlugs | null;
  if (!isInSearchMode || ignoreSearch) {
    displayedGroupedSlugs = paginatedSlugsGroups;
  } else if (!selectedChainsSlugsSortedGrouped) {
    displayedGroupedSlugs = null;
  } else {
    displayedGroupedSlugs = [];

    for (const [chainId, slugs] of selectedChainsSlugsSortedGrouped) {
      const filteredSlugs = searchAssetsWithNoMeta(
        searchValueDebounced,
        slugs,
        getTezMetadata,
        getEvmMetadata,
        slug => slug,
        getSlugFromChainSlug
      );

      if (filteredSlugs.length > 0) {
        displayedGroupedSlugs.push([chainId, filteredSlugs]);
      }
    }
  }

  return {
    applicableNetworks,
    isInSearchMode,
    displayedSlugs,
    displayedGroupedSlugs,
    isSyncing,
    loadNextGrouped,
    loadNextPlain
  };
};
