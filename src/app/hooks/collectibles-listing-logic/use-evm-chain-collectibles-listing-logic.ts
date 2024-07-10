import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isEqual, uniq } from 'lodash';
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

  const enabledSlugsSorted = useMemo(() => enabledSlugs.sort(sortPredicate), [enabledSlugs, sortPredicate]);

  const enabledSearchedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmChainCollectiblesWithNoMeta(searchValueDebounced, enabledSlugs, getMetadata, slug => slug)
        : enabledSlugsSorted,
    [isInSearchMode, searchValueDebounced, enabledSlugs, getMetadata, enabledSlugsSorted]
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

  const manageableTokenSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return enabledSearchedSlugs;

      const allUniqSlugs = uniq([...enabledSlugsSortedRef.current, ...allSlugsRef.current]).filter(slug =>
        allSlugs.includes(slug)
      );

      return isInSearchMode
        ? searchEvmChainCollectiblesWithNoMeta(searchValueDebounced, allUniqSlugs, getMetadata, slug => slug)
        : allUniqSlugs;
    },
    [manageActive, enabledSearchedSlugs, isInSearchMode, searchValueDebounced, getMetadata, allSlugs],
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
