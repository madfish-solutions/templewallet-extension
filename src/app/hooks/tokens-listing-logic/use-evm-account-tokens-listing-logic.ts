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
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useAllEvmAccountTokensSlugs, useEnabledEvmAccountTokensSlugs } from 'lib/assets/hooks';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useAllEvmChains } from 'temple/front';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getChainName, getSlugWithChainId } from './utils';

export const useEvmAccountTokensListingLogic = (
  publicKeyHash: HexString,
  filterZeroBalances = false,
  groupByNetwork = false,
  leadingAssetsChainSlugs?: string[],
  manageActive = false
) => {
  const enabledChainSlugs = useEnabledEvmAccountTokensSlugs(publicKeyHash);
  const allChainSlugs = useAllEvmAccountTokensSlugs(publicKeyHash);

  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

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

  const evmChains = useAllEvmChains();
  const balances = useRawEvmAccountBalancesSelector(publicKeyHash);
  const metadata = useEvmTokensMetadataRecordSelector();

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

      const balance = balances[chainId]?.[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const getMetadata = useCallback(
    (chainId: number, slug: string) => {
      if (slug === EVM_TOKEN_SLUG) {
        return evmChains[chainId]?.currency;
      }

      return metadata[chainId]?.[slug];
    },
    [evmChains, metadata]
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
      ? searchEvmTokensWithNoMeta(searchValueDebounced, leadingAssetsChainSlugs, getMetadata, getSlugWithChainId)
      : [...leadingAssetsChainSlugs].sort(tokensSortPredicate);
  }, [getMetadata, isInSearchMode, leadingAssetsChainSlugs, searchValueDebounced, tokensSortPredicate]);

  const filteredAssets = useMemo(() => {
    const searchedChainSlugs = isInSearchMode
      ? searchEvmTokensWithNoMeta(searchValueDebounced, enabledSourceArray, getMetadata, getSlugWithChainId)
      : [...enabledSourceArray].sort(tokensSortPredicate);

    return searchedLeadingChainSlugs.length ? searchedLeadingChainSlugs.concat(searchedChainSlugs) : searchedChainSlugs;
  }, [
    isInSearchMode,
    searchValueDebounced,
    enabledSourceArray,
    getMetadata,
    tokensSortPredicate,
    searchedLeadingChainSlugs
  ]);

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork || manageActive) return filteredAssets;

    const chainNameSlugsRecord = groupBy(filteredAssets, chainSlug => {
      const [_, chainId] = fromChainAssetSlug<number>(chainSlug);

      return getChainName(evmChains[chainId]);
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [manageActive, evmChains, filteredAssets, groupByNetwork]);

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
        ? searchEvmTokensWithNoMeta(searchValueDebounced, allUniqNonLeadingSlugs, getMetadata, getSlugWithChainId)
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
      getMetadata,
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
