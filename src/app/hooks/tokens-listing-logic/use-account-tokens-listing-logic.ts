import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { groupBy, isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useEvmBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoadingSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledAccountChainTokensSlugs } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getChainName, getSlugFromChainSlug } from './utils';

export const useAccountTokensListingLogic = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  filterZeroBalances = false,
  groupByNetwork = false,
  leadingAssetsChainSlugs?: string[],
  leadingAssetsAreFilterable = false
) => {
  const chainTokensSlugs = useEnabledAccountChainTokensSlugs(accountTezAddress, accountEvmAddress);

  const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

  const tezAssetsAreLoading = useAreAssetsLoading('tokens');
  const tezMetadatasLoading = useTokensMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const evmMetadatasLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing =
    tezAssetsAreLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading || exchangeRatesLoading;

  const nonLeadingAssets = useMemo(
    () =>
      leadingAssetsChainSlugs?.length
        ? chainTokensSlugs.filter(slug => !leadingAssetsChainSlugs.includes(slug))
        : chainTokensSlugs,
    [chainTokensSlugs, leadingAssetsChainSlugs]
  );

  const tezBalances = useBalancesAtomicRecordSelector();
  const evmBalances = useRawEvmAccountBalancesSelector(accountEvmAddress);

  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();
  const evmMetadata = useEvmTokensMetadataRecordSelector();

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [chainKind, chainId, slug] = fromChainAssetSlug(chainSlug);

      const balance =
        chainKind === TempleChainKind.Tezos
          ? tezBalances[getKeyForBalancesRecord(accountTezAddress, chainId as string)]?.data[slug]
          : evmBalances[chainId as number]?.[slug];
      return isDefined(balance) && balance !== '0';
    },
    [accountTezAddress, tezBalances, evmBalances]
  );

  const getTezMetadata = useGetTokenOrGasMetadata();

  const getEvmMetadata = useCallback(
    (chainId: number, slug: string) => {
      if (slug === EVM_TOKEN_SLUG) {
        return evmChains[chainId]?.currency;
      }

      return evmMetadata[chainId]?.[slug];
    },
    [evmChains, evmMetadata]
  );

  const sourceArray = useMemo(
    () => (filterZeroBalances ? nonLeadingAssets.filter(isNonZeroBalance) : nonLeadingAssets),
    [filterZeroBalances, nonLeadingAssets, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            sourceArray,
            getTezMetadata,
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : [...sourceArray].sort(tokensSortPredicate),
    [searchValueDebounced, sourceArray, getTezMetadata, getEvmMetadata, tokensSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssetsChainSlugs) || !leadingAssetsChainSlugs.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances
          ? leadingAssetsChainSlugs.filter(isNonZeroBalance)
          : leadingAssetsChainSlugs;

      const searchedLeadingSlugs = searchAssetsWithNoMeta(
        searchValueDebounced,
        filteredLeadingSlugs,
        getTezMetadata,
        getEvmMetadata,
        slug => slug,
        getSlugFromChainSlug
      );

      return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(searchedSlugs) : searchedSlugs;
    },
    [
      leadingAssetsChainSlugs,
      leadingAssetsAreFilterable,
      filterZeroBalances,
      isNonZeroBalance,
      searchedSlugs,
      searchValueDebounced,
      getTezMetadata,
      getEvmMetadata
    ],
    isEqual
  );

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork) return filteredAssets;

    const chainNameSlugsRecord = groupBy(filteredAssets, chainSlug => {
      const [chainKind, chainId] = fromChainAssetSlug(chainSlug);

      return getChainName(
        chainKind === TempleChainKind.Tezos ? tezosChains[chainId as string] : evmChains[chainId as number]
      );
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [filteredAssets, groupByNetwork]);

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(groupedAssets);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
