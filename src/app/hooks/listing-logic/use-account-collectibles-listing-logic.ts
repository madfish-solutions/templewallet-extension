import { useCallback, useMemo } from 'react';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { useEvmAccountCollectibles, useTezosAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetCollectibleMetadata, useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

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

  const tezCollectibles = useTezosAccountCollectibles(accountTezAddress);
  const evmCollectibles = useEvmAccountCollectibles(accountEvmAddress);

  const allChainSlugs = useMemoWithCompare(
    () => [
      ...tezCollectibles.map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)),
      ...evmCollectibles.map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug))
    ],
    [tezCollectibles, evmCollectibles]
  );

  const tezEnabledCollectiblesChainsSlugs = useMemoWithCompare(
    () =>
      tezCollectibles
        .filter(({ status }) => status === 'enabled')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)),
    [tezCollectibles]
  );

  const enabledSlugsSorted = useMemoWithCompare(
    () =>
      [
        ...tezEnabledCollectiblesChainsSlugs,
        ...evmCollectibles
          .filter(({ status }) => status === 'enabled')
          .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug))
      ].sort(sortPredicate),
    [tezEnabledCollectiblesChainsSlugs, evmCollectibles, sortPredicate]
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

  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);

  return {
    isInSearchMode,
    paginatedSlugs,
    isSyncing,
    loadNext
  };
};
