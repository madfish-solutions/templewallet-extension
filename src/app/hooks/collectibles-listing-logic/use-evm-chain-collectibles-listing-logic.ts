import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmBalancesLoadingSelector, useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAllEvmChainAccountCollectiblesSlugs, useEnabledEvmChainAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { searchEvmChainCollectiblesWithNoMeta } from 'lib/assets/search.utils';
import { useEvmChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

export const useEvmChainCollectiblesListingLogic = (
  publicKeyHash: HexString,
  chainId: number,
  manageActive = false
) => {
  const sortPredicate = useEvmChainCollectiblesSortPredicate(publicKeyHash, chainId);

  const enabledSlugs = useEnabledEvmChainAccountCollectiblesSlugs(publicKeyHash, chainId);
  const allSlugs = useAllEvmChainAccountCollectiblesSlugs(publicKeyHash, chainId);

  const metadata = useEvmCollectiblesMetadataRecordSelector();

  const balancesLoading = useEvmBalancesLoadingSelector();
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = balancesLoading || metadatasLoading;

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useCallback((slug: string) => metadata[chainId]?.[slug], [metadata, chainId]);

  // should sort only on initial mount
  const enabledSlugsSorted = useMemo(() => [...enabledSlugs].sort(sortPredicate), [enabledSlugs]);

  const enabledSearchedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmChainCollectiblesWithNoMeta(searchValueDebounced, enabledSlugsSorted, getMetadata, slug => slug)
        : enabledSlugsSorted,
    [isInSearchMode, searchValueDebounced, getMetadata, enabledSlugsSorted]
  );

  const allSlugsRef = useRef(allSlugs);
  const enabledSlugsSortedRef = useRef(enabledSlugsSorted);

  useEffect(() => {
    // keeping the same tokens order while manage is active
    if (!manageActive) {
      allSlugsRef.current = allSlugs;
      enabledSlugsSortedRef.current = enabledSlugsSorted;
    }
  }, [manageActive, allSlugs, enabledSlugsSorted]);

  const manageableSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return enabledSearchedSlugs;

      const allSlugsSet = new Set(allSlugs);
      const allUniqSlugsSet = new Set(enabledSlugsSortedRef.current.concat(allSlugsRef.current));

      const allUniqSlugsWithoutDeleted = Array.from(allUniqSlugsSet).filter(slug => allSlugsSet.has(slug));

      return isInSearchMode
        ? searchEvmChainCollectiblesWithNoMeta(
            searchValueDebounced,
            allUniqSlugsWithoutDeleted,
            getMetadata,
            slug => slug
          )
        : allUniqSlugsWithoutDeleted;
    },
    [manageActive, enabledSearchedSlugs, isInSearchMode, searchValueDebounced, getMetadata, allSlugs],
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
