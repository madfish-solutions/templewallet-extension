import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { groupBy, isEqual } from 'lodash';
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
import { useAllTezosChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getChainName, getSlugWithChainId } from './utils';

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

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useGetTokenOrGasMetadata();

  const enabledSourceArray = useMemo(
    () => (filterZeroBalances ? enabledChainSlugs.filter(isNonZeroBalance) : enabledChainSlugs),
    [filterZeroBalances, enabledChainSlugs, isNonZeroBalance]
  );

  const sortedEnabledChainSlugs = useMemo(
    () => [...enabledSourceArray].sort(tokensSortPredicate),
    [enabledSourceArray, tokensSortPredicate]
  );

  const searchedEnabledChainSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchTezosAssetsWithNoMeta(searchValueDebounced, sortedEnabledChainSlugs, getMetadata, getSlugWithChainId)
        : sortedEnabledChainSlugs,
    [isInSearchMode, searchValueDebounced, sortedEnabledChainSlugs, getMetadata]
  );

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork || manageActive) return searchedEnabledChainSlugs;

    const chainNameSlugsRecord = groupBy(searchedEnabledChainSlugs, chainSlug => {
      const [_, chainId] = fromChainAssetSlug<string>(chainSlug);

      return getChainName(tezosChains[chainId]);
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [groupByNetwork, manageActive, searchedEnabledChainSlugs, tezosChains]);

  const allChainSlugsRef = useRef(allChainSlugs);
  const sortedEnabledChainSlugsRef = useRef(sortedEnabledChainSlugs);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allChainSlugsRef.current = allChainSlugs;
      sortedEnabledChainSlugsRef.current = sortedEnabledChainSlugs;
    }
  }, [manageActive, allChainSlugs, sortedEnabledChainSlugs]);

  const manageableSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return groupedAssets;

      const allChainSlugsSet = new Set(allChainSlugs);
      const allUniqChainSlugsSet = new Set(sortedEnabledChainSlugsRef.current.concat(allChainSlugsRef.current));

      const allUniqChainSlugsWithoutDeleted = Array.from(allUniqChainSlugsSet).filter(slug =>
        allChainSlugsSet.has(slug)
      );

      return isInSearchMode
        ? searchTezosAssetsWithNoMeta(
            searchValueDebounced,
            allUniqChainSlugsWithoutDeleted,
            getMetadata,
            getSlugWithChainId
          )
        : allUniqChainSlugsWithoutDeleted;
    },
    [manageActive, groupedAssets, isInSearchMode, searchValueDebounced, getMetadata, allChainSlugs],
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
