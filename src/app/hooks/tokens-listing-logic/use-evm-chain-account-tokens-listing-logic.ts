import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual, uniq } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useRawEvmChainAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useEvmBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoadingSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useAllEvmChainAccountTokensSlugs, useEnabledEvmChainAccountTokensSlugs } from 'lib/assets/hooks';
import { searchEvmChainTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmChainTokensSortPredicate } from 'lib/assets/use-sorting';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useEvmChainByChainId } from 'temple/front/chains';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

export const useEvmChainAccountTokensListingLogic = (
  publicKeyHash: HexString,
  chainId: number,
  filterZeroBalances = false,
  leadingAssetsSlugs?: string[],
  manageActive = false
) => {
  const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

  const enabledTokenSlugs = useEnabledEvmChainAccountTokensSlugs(publicKeyHash, chainId);
  const allTokenSlugs = useAllEvmChainAccountTokensSlugs(publicKeyHash, chainId);

  const balances = useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

  const chain = useEvmChainByChainId(chainId);
  const metadata = useEvmTokensMetadataRecordSelector();

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

  const getMetadata = useCallback(
    (slug: string) => {
      if (slug === EVM_TOKEN_SLUG) {
        return chain?.currency;
      }

      return metadata[chainId]?.[slug];
    },
    [chain, metadata, chainId]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const searchedLeadingSlugs = useMemo(() => {
    if (!isDefined(leadingAssetsSlugs) || !leadingAssetsSlugs.length) return [];

    return isInSearchMode
      ? searchEvmChainTokensWithNoMeta(searchValueDebounced, leadingAssetsSlugs, getMetadata, slug => slug)
      : leadingAssetsSlugs;
  }, [getMetadata, isInSearchMode, leadingAssetsSlugs, searchValueDebounced]);

  const filteredSlugs = useMemo(() => {
    const enabledSearchedSlugs = isInSearchMode
      ? searchEvmChainTokensWithNoMeta(searchValueDebounced, enabledSourceArray, getMetadata, slug => slug)
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
        ? searchEvmChainTokensWithNoMeta(searchValueDebounced, allUniqNonLeadingSlugs, getMetadata, slug => slug)
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
