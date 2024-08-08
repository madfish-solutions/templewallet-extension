import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { useDebounce } from 'use-debounce';

import { useRawEvmChainAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useEvmChainBalancesLoadingSelector,
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

import { useManageableSlugs } from './use-manageable-slugs';

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

  const balancesLoading = useEvmChainBalancesLoadingSelector(chainId);
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
      if (slug === EVM_TOKEN_SLUG) return chain?.currency;

      return metadata[chainId]?.[slug];
    },
    [chain, metadata, chainId]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const search = useCallback(
    (slugs: string[]) => searchEvmChainTokensWithNoMeta(searchValueDebounced, slugs, getMetadata, slug => slug),
    [getMetadata, searchValueDebounced]
  );

  const filteredEnabledSlugs = useMemo(
    () => (filterZeroBalances ? enabledTokenSlugs.filter(isNonZeroBalance) : enabledTokenSlugs),
    [filterZeroBalances, enabledTokenSlugs, isNonZeroBalance]
  );

  const sortedEnabledSlugs = useMemo(
    () => [...filteredEnabledSlugs].sort(tokensSortPredicate),
    [filteredEnabledSlugs, tokensSortPredicate]
  );

  const searchedEnabledSlugs = useMemo(
    () => (isInSearchMode ? search(sortedEnabledSlugs) : sortedEnabledSlugs),
    [isInSearchMode, search, sortedEnabledSlugs]
  );

  const manageableSlugs = useManageableSlugs(manageActive, allTokenSlugs, sortedEnabledSlugs, searchedEnabledSlugs);

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
