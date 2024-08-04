import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
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

import { useManageableSlugs } from './use-manageable-slugs';

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

  const search = useCallback(
    (slugs: string[]) => searchTezosChainAssetsWithNoMeta(searchValueDebounced, slugs, getMetadata, slug => slug),
    [getMetadata, searchValueDebounced]
  );

  const searchedLeadingSlugs = useMemo(() => {
    if (!leadingAssetsSlugs?.length) return [];

    const filteredLeadingSlugs = filterZeroBalances ? leadingAssetsSlugs.filter(isNonZeroBalance) : leadingAssetsSlugs;

    return isInSearchMode ? search(filteredLeadingSlugs) : filteredLeadingSlugs;
  }, [leadingAssetsSlugs, filterZeroBalances, isNonZeroBalance, isInSearchMode, search]);

  // shouldn't resort on balances change // TODO: Doesn't work as expected. `filteredNonLeadingSlugs` depends on balances too.
  const enabledNonLeadingSlugsSorted = useMemo(
    () => [...filteredNonLeadingSlugs].sort(tokensSortPredicate),
    [filteredNonLeadingSlugs]
  );

  const searchedSlugs = useMemo(() => {
    const enabledSearchedSlugs = isInSearchMode ? search(enabledNonLeadingSlugsSorted) : enabledNonLeadingSlugsSorted;

    return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(enabledSearchedSlugs) : enabledSearchedSlugs;
  }, [enabledNonLeadingSlugsSorted, isInSearchMode, search, searchedLeadingSlugs]);

  const manageableSlugs = useManageableSlugs(
    manageActive,
    allNonLeadingSlugs,
    enabledNonLeadingSlugsSorted,
    searchedSlugs
  );

  const searchedManageableSlugs = useMemoWithCompare(
    () => (isInSearchMode ? search(manageableSlugs) : manageableSlugs),
    [isInSearchMode, search, manageableSlugs]
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(searchedManageableSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
