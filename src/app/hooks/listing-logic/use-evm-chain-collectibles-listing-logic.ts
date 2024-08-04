import { useCallback, useMemo, useState } from 'react';

import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmChainBalancesLoadingSelector, useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAllEvmChainAccountCollectiblesSlugs, useEnabledEvmChainAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { searchEvmChainCollectiblesWithNoMeta } from 'lib/assets/search.utils';
import { useEvmChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useManageableSlugs } from './use-manageable-slugs';

export const useEvmChainCollectiblesListingLogic = (
  publicKeyHash: HexString,
  chainId: number,
  manageActive = false
) => {
  const sortPredicate = useEvmChainCollectiblesSortPredicate(publicKeyHash, chainId);

  const enabledSlugs = useEnabledEvmChainAccountCollectiblesSlugs(publicKeyHash, chainId);
  const allSlugs = useAllEvmChainAccountCollectiblesSlugs(publicKeyHash, chainId);

  const metadata = useEvmCollectiblesMetadataRecordSelector();

  const balancesLoading = useEvmChainBalancesLoadingSelector(chainId);
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = balancesLoading || metadatasLoading;

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getMetadata = useCallback((slug: string) => metadata[chainId]?.[slug], [metadata, chainId]);

  const search = useCallback(
    (slugs: string[]) => searchEvmChainCollectiblesWithNoMeta(searchValueDebounced, slugs, getMetadata, slug => slug),
    [getMetadata, searchValueDebounced]
  );

  // shouldn't resort on balances change
  const enabledSlugsSorted = useMemo(() => [...enabledSlugs].sort(sortPredicate), [enabledSlugs]);

  const enabledSearchedSlugs = useMemo(
    () => (isInSearchMode ? search(enabledSlugsSorted) : enabledSlugsSorted),
    [isInSearchMode, search, enabledSlugsSorted]
  );

  const manageableSlugs = useManageableSlugs(manageActive, allSlugs, enabledSlugsSorted, enabledSearchedSlugs);

  const searchedManageableSlugs = useMemoWithCompare(
    () => (isInSearchMode ? search(manageableSlugs) : manageableSlugs),
    [isInSearchMode, search, manageableSlugs],
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
