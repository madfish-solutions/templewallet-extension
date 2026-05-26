import { useCallback, useMemo } from 'react';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { useEvmCollectiblesChainSlugs, useTezCollectiblesChainSlugs } from 'lib/assets/hooks/collectibles';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useGetCollectibleMetadata, useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { useManageableSlugs } from './use-manageable-slugs';
import { getSlugFromChainSlug, useCommonAssetsListingLogic } from './utils';

export const useAccountCollectiblesListingLogic = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  manageActive = false
) => {
  const sortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);

  const { allSlugs: allTezChainSlugs, enabledCollectiblesSlugs: tezEnabledCollectiblesChainSlugs } =
    useTezCollectiblesChainSlugs(accountTezAddress);
  const { allSlugs: allEvmChainSlugs, enabledCollectiblesSlugs: evmEnabledCollectiblesChainSlugs } =
    useEvmCollectiblesChainSlugs(accountEvmAddress);

  const allChainSlugs = useMemoWithCompare(
    () => allTezChainSlugs.concat(allEvmChainSlugs),
    [allTezChainSlugs, allEvmChainSlugs]
  );

  const enabledSlugsSorted = useMemoWithCompare(
    () => tezEnabledCollectiblesChainSlugs.concat(evmEnabledCollectiblesChainSlugs).sort(sortPredicate),
    [tezEnabledCollectiblesChainSlugs, evmEnabledCollectiblesChainSlugs, sortPredicate]
  );

  const evmMetadata = useEvmCollectiblesMetadataRecordSelector();

  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const tezMetadatasLoading = useCollectiblesMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesAreLoading();
  const evmMetadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const { searchValueDebounced, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    tezAssetsLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading
  );

  const getTezMetadata = useGetCollectibleMetadata();

  const getEvmMetadata = useCallback((chainId: number, slug: string) => evmMetadata[chainId]?.[slug], [evmMetadata]);

  const search = useCallback(
    (slugs: string[]) =>
      searchAssetsWithNoMeta(
        searchValueDebounced,
        slugs,
        (_, slug) => getTezMetadata(slug),
        getEvmMetadata,
        slug => slug,
        getSlugFromChainSlug
      ),
    [getEvmMetadata, getTezMetadata, searchValueDebounced]
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

  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainSlugs);

  return {
    isInSearchMode,
    paginatedSlugs,
    isSyncing,
    loadNext
  };
};
