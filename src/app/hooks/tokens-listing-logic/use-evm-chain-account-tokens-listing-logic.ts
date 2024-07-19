import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useRawEvmChainAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useEvmBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoadingSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useAllEvmChainAccountTokenSlugs, useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
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
  manageActive = false
) => {
  const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

  const enabledStoredTokenSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);
  const allStoredTokenSlugs = useAllEvmChainAccountTokenSlugs(publicKeyHash, chainId);

  const enabledTokenSlugs = useMemo(() => [EVM_TOKEN_SLUG, ...enabledStoredTokenSlugs], [enabledStoredTokenSlugs]);
  const allTokenSlugs = useMemo(() => [EVM_TOKEN_SLUG, ...allStoredTokenSlugs], [allStoredTokenSlugs]);

  const balances = useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

  const chain = useEvmChainByChainId(chainId);
  const metadata = useEvmTokensMetadataRecordSelector();

  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
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

  const filteredEnabledSlugs = useMemo(
    () => (filterZeroBalances ? enabledTokenSlugs.filter(isNonZeroBalance) : enabledTokenSlugs),
    [filterZeroBalances, enabledTokenSlugs, isNonZeroBalance]
  );

  // should sort only on initial mount
  const sortedEnabledSlugs = useMemo(() => [...filteredEnabledSlugs].sort(tokensSortPredicate), [filteredEnabledSlugs]);

  const searchedEnabledSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmChainTokensWithNoMeta(searchValueDebounced, sortedEnabledSlugs, getMetadata, slug => slug)
        : sortedEnabledSlugs,
    [sortedEnabledSlugs, getMetadata, isInSearchMode, searchValueDebounced]
  );

  const allTokenSlugsRef = useRef(allTokenSlugs);
  const sortedEnabledSlugsRef = useRef(sortedEnabledSlugs);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allTokenSlugsRef.current = allTokenSlugs;
      sortedEnabledSlugsRef.current = sortedEnabledSlugs;
    }
  }, [manageActive, allTokenSlugs, sortedEnabledSlugs]);

  const manageableSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return searchedEnabledSlugs;

      const allTokenSlugsSet = new Set(allTokenSlugs);
      const allUniqTokenSlugsSet = new Set(sortedEnabledSlugsRef.current.concat(allTokenSlugsRef.current));

      const allUniqSlugsWithoutDeleted = Array.from(allUniqTokenSlugsSet).filter(slug => allTokenSlugsSet.has(slug));

      return isInSearchMode
        ? searchEvmChainTokensWithNoMeta(searchValueDebounced, allUniqSlugsWithoutDeleted, getMetadata, slug => slug)
        : allUniqSlugsWithoutDeleted;
    },
    [manageActive, searchedEnabledSlugs, isInSearchMode, searchValueDebounced, getMetadata, allTokenSlugs],
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
