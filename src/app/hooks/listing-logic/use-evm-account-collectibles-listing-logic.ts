import { useCallback, useMemo, useState } from 'react';

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

import { useManageableSlugs } from './use-manageable-slugs';
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

  const search = useCallback(
    (slugs: string[]) => searchEvmCollectiblesWithNoMeta(searchValueDebounced, slugs, getMetadata, getSlugWithChainId),
    [getMetadata, searchValueDebounced]
  );

  // shouldn't resort on balances change
  const enabledSlugsSorted = useMemo(() => [...enabledChainSlugs].sort(sortPredicate), [enabledChainSlugs]);

  const enabledSearchedSlugs = useMemo(
    () => (isInSearchMode ? search(enabledSlugsSorted) : enabledSlugsSorted),
    [isInSearchMode, search, enabledSlugsSorted]
  );

  const manageableChainSlugs = useManageableSlugs(
    manageActive,
    allChainSlugs,
    enabledSlugsSorted,
    enabledSearchedSlugs
  );

  const searchedManageableSlugs = useMemoWithCompare(
    () => (isInSearchMode ? search(manageableChainSlugs) : manageableChainSlugs),
    [isInSearchMode, search, manageableChainSlugs],
    isEqual
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
