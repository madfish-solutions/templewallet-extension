import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmBalancesLoadingSelector, useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import {
  useAllAccountChainCollectiblesSlugs,
  useEnabledAccountChainCollectiblesSlugs
} from 'lib/assets/hooks/collectibles';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useGetCollectibleMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getSlugFromChainSlug } from './utils';

export const useAccountCollectiblesListingLogic = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  manageActive = false
) => {
  const sortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);

  const enabledChainSlugs = useEnabledAccountChainCollectiblesSlugs(accountTezAddress, accountEvmAddress);
  const allChainSlugs = useAllAccountChainCollectiblesSlugs(accountTezAddress, accountEvmAddress);

  const evmMetadata = useEvmCollectiblesMetadataRecordSelector();

  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const tezMetadatasLoading = useCollectiblesMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const EvmMetadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = tezAssetsLoading || tezMetadatasLoading || evmBalancesLoading || EvmMetadatasLoading;

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getTezMetadata = useGetCollectibleMetadata();

  const getEvmMetadata = useCallback((chainId: number, slug: string) => evmMetadata[chainId]?.[slug], [evmMetadata]);

  const enabledSlugsSorted = useMemo(
    () => [...enabledChainSlugs].sort(sortPredicate),
    [enabledChainSlugs, sortPredicate]
  );

  const enabledSearchedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            enabledChainSlugs,
            (_, slug) => getTezMetadata(slug),
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : enabledSlugsSorted,
    [isInSearchMode, searchValueDebounced, enabledChainSlugs, getEvmMetadata, enabledSlugsSorted, getTezMetadata]
  );

  const allChainSlugsRef = useRef(allChainSlugs);
  const enabledChainSlugsSortedRef = useRef(enabledSlugsSorted);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allChainSlugsRef.current = allChainSlugs;
      enabledChainSlugsSortedRef.current = enabledSlugsSorted;
    }
  }, [manageActive, allChainSlugs, enabledSlugsSorted]);

  const manageableSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return enabledSearchedSlugs;

      const allChainSlugsSet = new Set(allChainSlugs);
      const allUniqChainSlugsSet = new Set(enabledChainSlugsSortedRef.current.concat(allChainSlugsRef.current));

      const allUniqChainSlugsWithoutDeleted = Array.from(allUniqChainSlugsSet).filter(chainSlug =>
        allChainSlugsSet.has(chainSlug)
      );

      return isInSearchMode
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            allUniqChainSlugsWithoutDeleted,
            (_, slug) => getTezMetadata(slug),
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : allUniqChainSlugsWithoutDeleted;
    },
    [
      manageActive,
      enabledSearchedSlugs,
      isInSearchMode,
      searchValueDebounced,
      getEvmMetadata,
      allChainSlugs,
      getTezMetadata
    ],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(manageableSlugs);

  return {
    isInSearchMode,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
