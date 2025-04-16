import { useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { useEvmTokensExchangeRatesLoading, useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAccountTokens, useTezosAccountTokens } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { getSlugFromChainSlug, useCommonAssetsListingLogic } from './utils';

export const useAccountTokensForListing = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  filterZeroBalances = false
) => {
  const tezTokens = useTezosAccountTokens(accountTezAddress);
  const evmTokens = useEvmAccountTokens(accountEvmAddress);

  const enabledTezChains = useEnabledTezosChains();
  const enabledEvmChains = useEnabledEvmChains();

  const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

  const tezBalances = useBalancesAtomicRecordSelector();
  const evmBalances = useRawEvmAccountBalancesSelector(accountEvmAddress);

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

      const balance =
        chainKind === TempleChainKind.Tezos
          ? tezBalances[getKeyForBalancesRecord(accountTezAddress, chainId)]?.data[slug]
          : evmBalances[chainId]?.[slug];
      return isDefined(balance) && balance !== '0';
    },
    [accountTezAddress, tezBalances, evmBalances]
  );

  const gasChainsSlugs = useMemo(
    () => [
      ...enabledTezChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
      ...enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
    ],
    [enabledEvmChains, enabledTezChains]
  );

  const enabledChainsSlugsFiltered = useMemo(() => {
    const enabledChainsSlugs = gasChainsSlugs
      .concat(
        tezTokens
          .filter(({ status }) => status === 'enabled')
          .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
      )
      .concat(
        evmTokens
          .filter(({ status }) => status === 'enabled')
          .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug))
      );

    return filterZeroBalances ? enabledChainsSlugs.filter(isNonZeroBalance) : enabledChainsSlugs;
  }, [evmTokens, filterZeroBalances, gasChainsSlugs, isNonZeroBalance, tezTokens]);

  const enabledChainsSlugsSorted = useMemoWithCompare(
    () => enabledChainsSlugsFiltered.sort(tokensSortPredicate),
    [enabledChainsSlugsFiltered, tokensSortPredicate]
  );

  return {
    enabledChainsSlugsSorted,
    tezTokens,
    evmTokens,
    tokensSortPredicate
  };
};

export const useAccountTokensListingLogic = (allSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

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

  return {
    isInSearchMode,
    displayedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
