import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
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

  const enabledStoredTokenSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, chainId);
  const allStoredTokenSlugs = useAllTezosChainAccountTokenSlugs(publicKeyHash, chainId);

  const enabledTokenSlugs = useMemo(() => [TEZ_TOKEN_SLUG, ...enabledStoredTokenSlugs], [enabledStoredTokenSlugs]);
  const allTokenSlugs = useMemo(() => [TEZ_TOKEN_SLUG, ...allStoredTokenSlugs], [allStoredTokenSlugs]);

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

  const filteredNonLeadingSlugs = useMemo(
    () => (filterZeroBalances ? enabledNonLeadingSlugs.filter(isNonZeroBalance) : enabledNonLeadingSlugs),
    [filterZeroBalances, enabledNonLeadingSlugs, isNonZeroBalance]
  );

  const getMetadata = useGetChainTokenOrGasMetadata(chainId);

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const searchedLeadingSlugs = useMemo(() => {
    if (!isDefined(leadingAssetsSlugs) || !leadingAssetsSlugs.length) return [];

    const filteredLeadingSlugs = filterZeroBalances ? leadingAssetsSlugs.filter(isNonZeroBalance) : leadingAssetsSlugs;

    return isInSearchMode
      ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, filteredLeadingSlugs, getMetadata, slug => slug)
      : filteredLeadingSlugs;
  }, [leadingAssetsSlugs, filterZeroBalances, isNonZeroBalance, isInSearchMode, searchValueDebounced, getMetadata]);

  // should sort only on initial mount
  const enabledNonLeadingSlugsSorted = useMemo(
    () => [...filteredNonLeadingSlugs].sort(tokensSortPredicate),
    [filteredNonLeadingSlugs]
  );

  const searchedNonLeadingSlugs = useMemo(() => {
    const enabledSearchedSlugs = isInSearchMode
      ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, enabledNonLeadingSlugsSorted, getMetadata, slug => slug)
      : enabledNonLeadingSlugsSorted;

    return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(enabledSearchedSlugs) : enabledSearchedSlugs;
  }, [enabledNonLeadingSlugsSorted, getMetadata, isInSearchMode, searchValueDebounced, searchedLeadingSlugs]);

  const allNonLeadingSlugsRef = useRef(allNonLeadingSlugs);
  const enabledNonLeadingSlugsSortedRef = useRef(enabledNonLeadingSlugsSorted);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allNonLeadingSlugsRef.current = allNonLeadingSlugs;
      enabledNonLeadingSlugsSortedRef.current = enabledNonLeadingSlugsSorted;
    }
  }, [manageActive, allNonLeadingSlugs, enabledNonLeadingSlugsSorted]);

  const manageableSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return searchedNonLeadingSlugs;

      const allNonLeadingSlugsSet = new Set(allNonLeadingSlugs);
      const allUniqNonLeadingSlugsSet = new Set(
        enabledNonLeadingSlugsSortedRef.current.concat(allNonLeadingSlugsRef.current)
      );

      const allUniqNonLeadingSlugsWithoutDeleted = Array.from(allUniqNonLeadingSlugsSet).filter(slug =>
        allNonLeadingSlugsSet.has(slug)
      );

      const allNonLeadingSearchedSlugs = isInSearchMode
        ? searchTezosChainAssetsWithNoMeta(
            searchValueDebounced,
            allUniqNonLeadingSlugsWithoutDeleted,
            getMetadata,
            slug => slug
          )
        : allUniqNonLeadingSlugsWithoutDeleted;

      return searchedLeadingSlugs.length
        ? searchedLeadingSlugs.concat(allNonLeadingSearchedSlugs)
        : allNonLeadingSearchedSlugs;
    },
    [
      manageActive,
      searchedNonLeadingSlugs,
      isInSearchMode,
      searchValueDebounced,
      getMetadata,
      searchedLeadingSlugs,
      allNonLeadingSlugs
    ],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(manageableSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
