import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosAccountTokenSlugs } from 'lib/assets/hooks';
import { useAllTezosAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useGroupedSlugs } from './use-grouped-slugs';
import { useManageableSlugs } from './use-manageable-slugs';
import { getSlugWithChainId } from './utils';

export const useTezosAccountTokensListingLogic = (
  publicKeyHash: string,
  filterZeroBalances = false,
  groupByNetwork = false,
  manageActive = false
) => {
  const tokensSortPredicate = useTezosAccountTokensSortPredicate(publicKeyHash);

  const enabledStoredChainSlugs = useEnabledTezosAccountTokenSlugs(publicKeyHash);
  const allStoredChainSlugs = useAllTezosAccountTokenSlugs(publicKeyHash);

  const enabledChains = useEnabledTezosChains();

  const nativeChainSlugs = useMemo(
    () => enabledChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
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

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isSyncing = assetsAreLoading || metadatasLoading;

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

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useGetTokenOrGasMetadata();

  const search = useCallback(
    (slugs: string[]) => searchTezosAssetsWithNoMeta(searchValueDebounced, slugs, getMetadata, getSlugWithChainId),
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
