import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useAllAccountChainTokensSlugs, useEnabledAccountChainTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useAllEvmChains, useAllTezosChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getChainName, getSlugFromChainSlug } from './utils';

export const useAccountTokensListingLogic = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  filterZeroBalances = false,
  groupByNetwork = false,
  manageActive = false
) => {
  const enabledStoredChainSlugs = useEnabledAccountChainTokenSlugs(accountTezAddress, accountEvmAddress);
  const allStoredChainSlugs = useAllAccountChainTokensSlugs(accountTezAddress, accountEvmAddress);

  const enabledTezChains = useEnabledTezosChains();
  const enabledEvmChains = useEnabledEvmChains();

  const nativeChainSlugs = useMemo(
    () => [
      ...enabledTezChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
      ...enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
    ],
    [enabledEvmChains, enabledTezChains]
  );

  const enabledChainSlugs = useMemo(
    () => nativeChainSlugs.concat(enabledStoredChainSlugs),
    [nativeChainSlugs, enabledStoredChainSlugs]
  );
  const allChainSlugs = useMemo(
    () => nativeChainSlugs.concat(allStoredChainSlugs),
    [nativeChainSlugs, allStoredChainSlugs]
  );

  const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

  const tezAssetsAreLoading = useAreAssetsLoading('tokens');
  const tezMetadatasLoading = useTokensMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const evmMetadatasLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing =
    tezAssetsAreLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading || exchangeRatesLoading;

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
      if (slug === EVM_TOKEN_SLUG) return evmChains[chainId]?.currency;

      return evmMetadata[chainId]?.[slug];
    },
    [evmChains, evmMetadata]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const filteredEnabledChainSlugs = useMemo(
    () => (filterZeroBalances ? enabledChainSlugs.filter(isNonZeroBalance) : enabledChainSlugs),
    [filterZeroBalances, enabledChainSlugs, isNonZeroBalance]
  );

  // should sort only on initial mount
  const sortedEnabledChainSlugs = useMemo(
    () => [...filteredEnabledChainSlugs].sort(tokensSortPredicate),
    [filteredEnabledChainSlugs]
  );

  const searchedEnabledChainSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            sortedEnabledChainSlugs,
            getTezMetadata,
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : sortedEnabledChainSlugs,
    [isInSearchMode, searchValueDebounced, sortedEnabledChainSlugs, getTezMetadata, getEvmMetadata]
  );

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork || manageActive) return searchedEnabledChainSlugs;

    const chainNameSlugsRecord = groupBy(searchedEnabledChainSlugs, chainSlug => {
      const [chainKind, chainId] = fromChainAssetSlug(chainSlug);

      return getChainName(
        chainKind === TempleChainKind.Tezos ? tezosChains[chainId as string] : evmChains[chainId as number]
      );
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [evmChains, searchedEnabledChainSlugs, groupByNetwork, manageActive, tezosChains]);

  const allChainSlugsRef = useRef(allChainSlugs);
  const sortedEnabledChainSlugsRef = useRef(sortedEnabledChainSlugs);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allChainSlugsRef.current = allChainSlugs;
      sortedEnabledChainSlugsRef.current = sortedEnabledChainSlugs;
    }
  }, [manageActive, allChainSlugs, sortedEnabledChainSlugs]);

  const manageableChainSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return groupedAssets;

      const allChainSlugsSet = new Set(allChainSlugs);
      const allUniqChainSlugsSet = new Set(sortedEnabledChainSlugsRef.current.concat(allChainSlugsRef.current));

      const allUniqChainSlugsWithoutDeleted = Array.from(allUniqChainSlugsSet).filter(slug =>
        allChainSlugsSet.has(slug)
      );

      return isInSearchMode
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            allUniqChainSlugsWithoutDeleted,
            getTezMetadata,
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : allUniqChainSlugsWithoutDeleted;
    },
    [manageActive, groupedAssets, isInSearchMode, searchValueDebounced, getTezMetadata, getEvmMetadata, allChainSlugs],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(manageableChainSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
