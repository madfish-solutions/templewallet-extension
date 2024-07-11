import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { groupBy, isEqual, uniq } from 'lodash';
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
import { useAllAccountChainTokensSlugs, useEnabledAccountChainTokensSlugs } from 'lib/assets/hooks/tokens';
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
  manageActive = false
) => {
  const enabledChainSlugs = useEnabledAccountChainTokensSlugs(accountTezAddress, accountEvmAddress);
  const allChainSlugs = useAllAccountChainTokensSlugs(accountTezAddress, accountEvmAddress);

  const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

  const tezAssetsAreLoading = useAreAssetsLoading('tokens');
  const tezMetadatasLoading = useTokensMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const evmMetadatasLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing =
    tezAssetsAreLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading || exchangeRatesLoading;

  const enabledNonLeadingChainSlugs = useMemo(
    () =>
      leadingAssetsChainSlugs?.length
        ? enabledChainSlugs.filter(slug => !leadingAssetsChainSlugs.includes(slug))
        : enabledChainSlugs,
    [enabledChainSlugs, leadingAssetsChainSlugs]
  );

  const allNonLeadingChainSlugs = useMemo(
    () =>
      leadingAssetsChainSlugs?.length
        ? allChainSlugs.filter(slug => !leadingAssetsChainSlugs.includes(slug))
        : allChainSlugs,
    [allChainSlugs, leadingAssetsChainSlugs]
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
      if (slug === EVM_TOKEN_SLUG) return evmChains[chainId]?.currency;

      return evmMetadata[chainId]?.[slug];
    },
    [evmChains, evmMetadata]
  );

  const enabledSourceArray = useMemo(
    () => (filterZeroBalances ? enabledNonLeadingChainSlugs.filter(isNonZeroBalance) : enabledNonLeadingChainSlugs),
    [filterZeroBalances, enabledNonLeadingChainSlugs, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const searchedLeadingChainSlugs = useMemo(() => {
    if (!isDefined(leadingAssetsChainSlugs) || !leadingAssetsChainSlugs.length) return [];

    return isInSearchMode
      ? searchAssetsWithNoMeta(
          searchValueDebounced,
          leadingAssetsChainSlugs,
          getTezMetadata,
          getEvmMetadata,
          slug => slug,
          getSlugFromChainSlug
        )
      : [...leadingAssetsChainSlugs].sort(tokensSortPredicate);
  }, [
    getEvmMetadata,
    getTezMetadata,
    isInSearchMode,
    leadingAssetsChainSlugs,
    searchValueDebounced,
    tokensSortPredicate
  ]);

  const filteredAssets = useMemo(() => {
    const searchedChainSlugs = isInSearchMode
      ? searchAssetsWithNoMeta(
          searchValueDebounced,
          enabledSourceArray,
          getTezMetadata,
          getEvmMetadata,
          slug => slug,
          getSlugFromChainSlug
        )
      : [...enabledSourceArray].sort(tokensSortPredicate);

    return searchedLeadingChainSlugs.length ? searchedLeadingChainSlugs.concat(searchedChainSlugs) : searchedChainSlugs;
  }, [
    isInSearchMode,
    searchValueDebounced,
    enabledSourceArray,
    getTezMetadata,
    getEvmMetadata,
    tokensSortPredicate,
    searchedLeadingChainSlugs
  ]);

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork || manageActive) return filteredAssets;

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
  }, [evmChains, filteredAssets, groupByNetwork, manageActive, tezosChains]);

  const enabledNonLeadingChainSlugsSorted = useMemo(
    () => enabledNonLeadingChainSlugs.sort(tokensSortPredicate),
    [enabledNonLeadingChainSlugs, tokensSortPredicate]
  );

  const allNonLeadingChainSlugsRef = useRef(allNonLeadingChainSlugs);
  const enabledNonLeadingChainSlugsSortedRef = useRef(enabledNonLeadingChainSlugsSorted);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allNonLeadingChainSlugsRef.current = allNonLeadingChainSlugs;
      enabledNonLeadingChainSlugsSortedRef.current = enabledNonLeadingChainSlugsSorted;
    }
  }, [manageActive, allNonLeadingChainSlugs, enabledNonLeadingChainSlugsSorted]);

  const manageableTokenSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return groupedAssets;

      const allUniqNonLeadingSlugs = uniq([
        ...enabledNonLeadingChainSlugsSortedRef.current,
        ...allNonLeadingChainSlugsRef.current
      ]).filter(slug => allNonLeadingChainSlugs.includes(slug));

      const allNonLeadingSearchedSlugs = isInSearchMode
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            allUniqNonLeadingSlugs,
            getTezMetadata,
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : allUniqNonLeadingSlugs;

      return searchedLeadingChainSlugs.length
        ? searchedLeadingChainSlugs.concat(allNonLeadingSearchedSlugs)
        : allNonLeadingSearchedSlugs;
    },
    [
      manageActive,
      groupedAssets,
      isInSearchMode,
      searchValueDebounced,
      getTezMetadata,
      getEvmMetadata,
      searchedLeadingChainSlugs,
      allNonLeadingChainSlugs
    ],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(manageableTokenSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
