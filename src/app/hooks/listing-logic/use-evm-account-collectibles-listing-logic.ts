import { useCallback, useMemo } from 'react';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useEvmAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { searchEvmCollectiblesWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { useManageableSlugs } from './use-manageable-slugs';
import { getSlugWithChainId, useCommonAssetsListingLogic } from './utils';

export const useEvmAccountCollectiblesListingLogic = (publicKeyHash: HexString, manageActive = false) => {
  const sortPredicate = useEvmAccountCollectiblesSortPredicate(publicKeyHash);

  const allAccountCollectibles = useEvmAccountCollectibles(publicKeyHash);

  const allChainSlugs = useMemoWithCompare(
    () => allAccountCollectibles.map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug)),
    [allAccountCollectibles]
  );

  const enabledChainSlugs = useMemoWithCompare(
    () =>
      allAccountCollectibles
        .filter(({ status }) => status === 'enabled')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug)),
    [allAccountCollectibles]
  );

  const metadata = useEvmCollectiblesMetadataRecordSelector();

  const balancesLoading = useEvmBalancesAreLoading();
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    balancesLoading || metadatasLoading
  );

  const getMetadata = useCallback((chainId: number, slug: string) => metadata[chainId]?.[slug], [metadata]);

  const search = useCallback(
    (slugs: string[]) => searchEvmCollectiblesWithNoMeta(searchValueDebounced, slugs, getMetadata, getSlugWithChainId),
    [getMetadata, searchValueDebounced]
  );

  const enabledSlugsSorted = useMemo(
    () => [...enabledChainSlugs].sort(sortPredicate),
    [enabledChainSlugs, sortPredicate]
  );

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
    [isInSearchMode, search, manageableChainSlugs]
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(searchedManageableSlugs);

  return {
    isInSearchMode,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
