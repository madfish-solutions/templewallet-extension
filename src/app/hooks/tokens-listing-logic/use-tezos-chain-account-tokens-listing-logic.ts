import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual, uniq } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useAllTezosChainAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

export const useTezosChainAccountTokensListingLogic = (
  publicKeyHash: string,
  chainId: string,
  filterZeroBalances = false,
  leadingAssetsSlugs?: string[],
  manageActive = false
) => {
  const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, chainId);

  const enabledTokenSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, chainId);
  const allTokenSlugs = useAllTezosChainAccountTokenSlugs(publicKeyHash, chainId);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isSyncing = assetsAreLoading || metadatasLoading;

  const enabledNonLeadingSlugs = useMemo(
    () =>
      leadingAssetsSlugs?.length
        ? enabledTokenSlugs.filter(slug => !leadingAssetsSlugs.includes(slug))
        : enabledTokenSlugs,
    [enabledTokenSlugs, leadingAssetsSlugs]
  );

  const allNonLeadingSlugs = useMemo(
    () =>
      leadingAssetsSlugs?.length ? allTokenSlugs.filter(slug => !leadingAssetsSlugs.includes(slug)) : allTokenSlugs,
    [allTokenSlugs, leadingAssetsSlugs]
  );

  const balances = useAllAccountBalancesSelector(publicKeyHash, chainId);

  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const enabledSourceArray = useMemo(
    () => (filterZeroBalances ? enabledNonLeadingSlugs.filter(isNonZeroBalance) : enabledNonLeadingSlugs),
    [filterZeroBalances, enabledNonLeadingSlugs, isNonZeroBalance]
  );

  const getMetadata = useGetChainTokenOrGasMetadata(chainId);

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const searchedLeadingSlugs = useMemo(() => {
    if (!isDefined(leadingAssetsSlugs) || !leadingAssetsSlugs.length) return [];

    return isInSearchMode
      ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, leadingAssetsSlugs, getMetadata, slug => slug)
      : leadingAssetsSlugs;
  }, [getMetadata, isInSearchMode, leadingAssetsSlugs, searchValueDebounced]);

  const filteredSlugs = useMemo(() => {
    const enabledSearchedSlugs = isInSearchMode
      ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, enabledSourceArray, getMetadata, slug => slug)
      : [...enabledSourceArray].sort(tokensSortPredicate);

    return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(enabledSearchedSlugs) : enabledSearchedSlugs;
  }, [
    enabledSourceArray,
    getMetadata,
    isInSearchMode,
    searchValueDebounced,
    searchedLeadingSlugs,
    tokensSortPredicate
  ]);

  const enabledNonLeadingSlugsSorted = useMemo(
    () => enabledNonLeadingSlugs.sort(tokensSortPredicate),
    [enabledNonLeadingSlugs, tokensSortPredicate]
  );

  const allNonLeadingAssetsRef = useRef(allNonLeadingSlugs);
  const enabledNonLeadingSlugsSortedRef = useRef(enabledNonLeadingSlugsSorted);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allNonLeadingAssetsRef.current = allNonLeadingSlugs;
      enabledNonLeadingSlugsSortedRef.current = enabledNonLeadingSlugsSorted;
    }
  }, [manageActive, allNonLeadingSlugs, enabledNonLeadingSlugsSorted]);

  const manageableTokenSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return filteredSlugs;

      const allUniqNonLeadingSlugs = uniq([
        ...enabledNonLeadingSlugsSortedRef.current,
        ...allNonLeadingAssetsRef.current
      ]).filter(slug => allNonLeadingSlugs.includes(slug));

      const allNonLeadingSearchedSlugs = isInSearchMode
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, allUniqNonLeadingSlugs, getMetadata, slug => slug)
        : allUniqNonLeadingSlugs;

      return searchedLeadingSlugs.length
        ? searchedLeadingSlugs.concat(allNonLeadingSearchedSlugs)
        : allNonLeadingSearchedSlugs;
    },
    [
      manageActive,
      filteredSlugs,
      isInSearchMode,
      searchValueDebounced,
      getMetadata,
      searchedLeadingSlugs,
      allNonLeadingSlugs
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
