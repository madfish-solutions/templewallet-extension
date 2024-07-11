import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { groupBy, isEqual, uniq } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { useEnabledTezosAccountTokensSlugs } from 'lib/assets/hooks';
import { useAllTezosAccountTokensSlugs } from 'lib/assets/hooks/tokens';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useAllTezosChains } from 'temple/front';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getChainName, getSlugWithChainId } from './utils';

export const useTezosAccountTokensListingLogic = (
  publicKeyHash: string,
  filterZeroBalances = false,
  groupByNetwork = false,
  leadingAssetsChainSlugs?: string[],
  manageActive = false
) => {
  const tokensSortPredicate = useTezosAccountTokensSortPredicate(publicKeyHash);

  const enabledChainSlugs = useEnabledTezosAccountTokensSlugs(publicKeyHash);
  const allChainSlugs = useAllTezosAccountTokensSlugs(publicKeyHash);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isSyncing = assetsAreLoading || metadatasLoading;

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

  const tezosChains = useAllTezosChains();
  const balancesRecord = useBalancesAtomicRecordSelector();

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [_, chainId, assetSlug] = fromChainAssetSlug<string>(chainSlug);
      const key = getKeyForBalancesRecord(publicKeyHash, chainId);

      const balance = balancesRecord[key]?.data[assetSlug];
      return isDefined(balance) && balance !== '0';
    },
    [balancesRecord, publicKeyHash]
  );

  const enabledSourceArray = useMemo(
    () => (filterZeroBalances ? enabledNonLeadingChainSlugs.filter(isNonZeroBalance) : enabledNonLeadingChainSlugs),
    [filterZeroBalances, enabledNonLeadingChainSlugs, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useGetTokenOrGasMetadata();

  const searchedLeadingChainSlugs = useMemo(() => {
    if (!isDefined(leadingAssetsChainSlugs) || !leadingAssetsChainSlugs.length) return [];

    return isInSearchMode
      ? searchTezosAssetsWithNoMeta(searchValueDebounced, leadingAssetsChainSlugs, getMetadata, getSlugWithChainId)
      : [...leadingAssetsChainSlugs].sort(tokensSortPredicate);
  }, [getMetadata, isInSearchMode, leadingAssetsChainSlugs, searchValueDebounced, tokensSortPredicate]);

  const filteredAssets = useMemoWithCompare(
    () => {
      const searchedChainSlugs = isInSearchMode
        ? searchTezosAssetsWithNoMeta(searchValueDebounced, enabledSourceArray, getMetadata, getSlugWithChainId)
        : [...enabledSourceArray].sort(tokensSortPredicate);

      return searchedLeadingChainSlugs.length
        ? searchedLeadingChainSlugs.concat(searchedChainSlugs)
        : searchedChainSlugs;
    },
    [
      isInSearchMode,
      searchValueDebounced,
      enabledSourceArray,
      getMetadata,
      tokensSortPredicate,
      searchedLeadingChainSlugs
    ],
    isEqual
  );

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork || manageActive) return filteredAssets;

    const chainNameSlugsRecord = groupBy(filteredAssets, chainSlug => {
      const [_, chainId] = fromChainAssetSlug<string>(chainSlug);

      return getChainName(tezosChains[chainId]);
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [groupByNetwork, manageActive, filteredAssets, tezosChains]);

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
        ? searchTezosAssetsWithNoMeta(searchValueDebounced, allUniqNonLeadingSlugs, getMetadata, getSlugWithChainId)
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
