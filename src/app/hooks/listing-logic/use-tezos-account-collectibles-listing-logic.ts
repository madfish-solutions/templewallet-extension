import { useMemo } from 'react';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { useTezosAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetCollectibleMetadata, useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

import { ITEMS_PER_PAGE, useTezosAccountCollectiblesPaginationLogic } from '../use-collectibles-pagination-logic';

import { getSlugWithChainId, useCommonAssetsListingLogic } from './utils';

export const useTezosAccountCollectiblesForListing = (publicKeyHash: string) => {
  const sortPredicate = useTezosAccountCollectiblesSortPredicate(publicKeyHash);

  const allAccountCollectibles = useTezosAccountCollectibles(publicKeyHash);

  const enabledChainSlugsSorted = useMemoWithCompare(
    () =>
      allAccountCollectibles
        .filter(({ status }) => status === 'enabled')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
        .sort(sortPredicate),
    [allAccountCollectibles, sortPredicate]
  );

  return {
    enabledChainSlugsSorted,
    allAccountCollectibles,
    sortPredicate
  };
};

export const useTezosAccountCollectiblesListingLogic = (allSlugsSorted: string[]) => {
  const {
    slugs: paginatedSlugs,
    isLoading: pageIsLoading,
    loadNext
  } = useTezosAccountCollectiblesPaginationLogic(allSlugsSorted);

  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const metadatasLoading = useCollectiblesMetadataLoadingSelector();

  const { searchValueDebounced, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(isInSearchMode =>
    isInSearchMode ? assetsAreLoading || metadatasLoading : assetsAreLoading || pageIsLoading
  );

  const metaToCheckAndLoad = useMemo(() => {
    // Search is not paginated. This is how all needed meta is loaded
    if (isInSearchMode) return allSlugsSorted;

    // In pagination, loading meta for the following pages in advance,
    // while not required in current page
    return pageIsLoading ? undefined : allSlugsSorted.slice(paginatedSlugs.length + ITEMS_PER_PAGE * 2);
  }, [isInSearchMode, pageIsLoading, allSlugsSorted, paginatedSlugs.length]);

  useTezosCollectiblesMetadataPresenceCheck(metaToCheckAndLoad);

  const getCollectibleMetadata = useGetCollectibleMetadata();

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchTezosAssetsWithNoMeta(
            searchValueDebounced,
            allSlugsSorted,
            (_, slug) => getCollectibleMetadata(slug),
            getSlugWithChainId
          )
        : paginatedSlugs,
    [paginatedSlugs, allSlugsSorted, isInSearchMode, searchValueDebounced, getCollectibleMetadata]
  );

  return {
    isInSearchMode,
    displayedSlugs,
    isSyncing,
    loadNext
  };
};
