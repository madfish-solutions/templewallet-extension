import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmBalancesLoadingSelector, useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAllEvmAccountCollectiblesSlugs, useEnabledEvmAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { searchEvmCollectiblesWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getSlugWithChainId } from './utils';

export const useEvmAccountCollectiblesListingLogic = (publicKeyHash: HexString, manageActive = false) => {
  const sortPredicate = useEvmAccountCollectiblesSortPredicate(publicKeyHash);

  const enabledChainSlugs = useEnabledEvmAccountCollectiblesSlugs(publicKeyHash);
  const allChainSlugs = useAllEvmAccountCollectiblesSlugs(publicKeyHash);

  const metadata = useEvmCollectiblesMetadataRecordSelector();

  const balancesLoading = useEvmBalancesLoadingSelector();
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = balancesLoading || metadatasLoading;

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useCallback((chainId: number, slug: string) => metadata[chainId]?.[slug], [metadata]);

  // should sort only on initial mount
  const enabledSlugsSorted = useMemo(() => [...enabledChainSlugs].sort(sortPredicate), [enabledChainSlugs]);

  const enabledSearchedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmCollectiblesWithNoMeta(searchValueDebounced, enabledSlugsSorted, getMetadata, getSlugWithChainId)
        : enabledSlugsSorted,
    [isInSearchMode, searchValueDebounced, getMetadata, enabledSlugsSorted]
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
        ? searchEvmCollectiblesWithNoMeta(
            searchValueDebounced,
            allUniqChainSlugsWithoutDeleted,
            getMetadata,
            getSlugWithChainId
          )
        : allUniqChainSlugsWithoutDeleted;
    },
    [manageActive, enabledSearchedSlugs, isInSearchMode, searchValueDebounced, getMetadata, allChainSlugs],
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