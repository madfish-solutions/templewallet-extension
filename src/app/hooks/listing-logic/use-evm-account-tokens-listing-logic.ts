import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useEvmBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoadingSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useAllEvmAccountTokenSlugs, useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useAllEvmChains, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useGroupedSlugs } from './use-grouped-slugs';
import { useManageableSlugs } from './use-manageable-slugs';
import { getSlugWithChainId } from './utils';

export const useEvmAccountTokensListingLogic = (
  publicKeyHash: HexString,
  filterZeroBalances = false,
  groupByNetwork = false,
  manageActive = false
) => {
  const enabledStoredChainSlugs = useEnabledEvmAccountTokenSlugs(publicKeyHash);
  const allStoredChainSlugs = useAllEvmAccountTokenSlugs(publicKeyHash);

  const enabledChains = useEnabledEvmChains();

  const nativeChainSlugs = useMemo(
    () => enabledChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
    [enabledChains]
  );

  const enabledChainSlugs = useMemo(
    () => nativeChainSlugs.concat(enabledStoredChainSlugs),
    [nativeChainSlugs, enabledStoredChainSlugs]
  );
  const allChainSlugs = useMemo(
    () => nativeChainSlugs.concat(allStoredChainSlugs),
    [nativeChainSlugs, allStoredChainSlugs]
  );

  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

  const allEvmChains = useAllEvmChains();
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
        return allEvmChains[chainId]?.currency;
      }

      return metadata[chainId]?.[slug];
    },
    [allEvmChains, metadata]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const search = useCallback(
    (slugs: string[]) => searchEvmTokensWithNoMeta(searchValueDebounced, slugs, getMetadata, getSlugWithChainId),
    [getMetadata, searchValueDebounced]
  );

  const filteredEnabledChainSlugs = useMemo(
    () => (filterZeroBalances ? enabledChainSlugs.filter(isNonZeroBalance) : enabledChainSlugs),
    [filterZeroBalances, enabledChainSlugs, isNonZeroBalance]
  );

  // shouldn't resort on balances change
  const sortedEnabledChainSlugs = useMemo(
    () => [...filteredEnabledChainSlugs].sort(tokensSortPredicate),
    [filteredEnabledChainSlugs]
  );

  const searchedEnabledChainSlugs = useMemo(
    () => (isInSearchMode ? search(sortedEnabledChainSlugs) : sortedEnabledChainSlugs),
    [isInSearchMode, search, sortedEnabledChainSlugs]
  );

  const groupedAssets = useGroupedSlugs(groupByNetwork, manageActive, searchedEnabledChainSlugs);

  const manageableChainSlugs = useManageableSlugs(manageActive, allChainSlugs, sortedEnabledChainSlugs, groupedAssets);

  const searchedManageableChainSlugs = useMemoWithCompare(
    () => (isInSearchMode ? search(manageableChainSlugs) : manageableChainSlugs),
    [isInSearchMode, search, manageableChainSlugs],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(searchedManageableChainSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
