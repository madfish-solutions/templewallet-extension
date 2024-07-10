import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isEqual, uniq } from 'lodash';
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

  const enabledSlugsSorted = useMemo(() => enabledChainSlugs.sort(sortPredicate), [enabledChainSlugs, sortPredicate]);

  const enabledSearchedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmCollectiblesWithNoMeta(searchValueDebounced, enabledChainSlugs, getMetadata, getSlugWithChainId)
        : enabledSlugsSorted,
    [isInSearchMode, searchValueDebounced, enabledChainSlugs, getMetadata, enabledSlugsSorted]
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

  const manageableTokenSlugs = useMemoWithCompare(
    () => {
      if (!manageActive) return enabledSearchedSlugs;

      const allUniqChainSlugs = uniq([...enabledChainSlugsSortedRef.current, ...allChainSlugsRef.current]).filter(
        chainSlug => allChainSlugs.includes(chainSlug)
      );

      return isInSearchMode
        ? searchEvmCollectiblesWithNoMeta(searchValueDebounced, allUniqChainSlugs, getMetadata, getSlugWithChainId)
        : allUniqChainSlugs;
    },
    [manageActive, enabledSearchedSlugs, isInSearchMode, searchValueDebounced, getMetadata, allChainSlugs],
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
