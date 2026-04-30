import { useCallback, useMemo } from 'react';

import { useDebounce } from 'use-debounce';

import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import { useManageState, useSearchState, useSelectedChainsState } from 'app/hooks/use-collectibles-view-state';
import { useSimpleAssetsPaginationLogic } from 'app/hooks/use-simple-assets-pagination-logic';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useAllCollectiblesDetailsSelector,
  useCollectiblesDetailsErrorSelector
} from 'app/store/tezos/collectibles/selectors';
import { AccountCollectible } from 'lib/assets/hooks/collectibles';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { fromAssetSlug, parseChainAssetSlug, toChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { buildTokenImagesStack } from 'lib/images-uri';
import { useGetCollectibleMetadata, useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { getCollectionName } from 'lib/metadata/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { CollectiblesCollection } from '../types';

export const useCollectiblesListingLogic = (
  allAccountCollectibles: AccountCollectible[],
  sortPredicate: (aChainAssetSlug: string, bChainAssetSlug: string) => number
) => {
  const { manageActive } = useManageState();
  const { selectedChains } = useSelectedChainsState();
  const allTezosCollectiblesDetails = useAllCollectiblesDetailsSelector();
  const tezDetailsLoading = useAllCollectiblesDetailsLoadingSelector();
  const tezDetailsError = useCollectiblesDetailsErrorSelector();
  const tezDetailsReady =
    Boolean(tezDetailsError) ||
    Object.keys(allTezosCollectiblesDetails).length > 0 ||
    allAccountCollectibles.every(({ status, chainId }) => status !== 'enabled' || typeof chainId === 'number');

  const enabledCollectibles = useMemo(
    () => allAccountCollectibles.filter(({ status }) => status === 'enabled'),
    [allAccountCollectibles]
  );

  const tezEnabledCollectiblesChainsSlugs = useMemoWithCompare(
    () =>
      enabledCollectibles
        .filter(({ chainId }) => typeof chainId === 'string')
        .map(({ slug, chainId }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)),
    [enabledCollectibles]
  );
  const toSortedSlugs = useCallback(
    (collectibles: AccountCollectible[]) =>
      collectibles
        .map(({ slug, chainId }) =>
          toChainAssetSlug(typeof chainId === 'number' ? TempleChainKind.EVM : TempleChainKind.Tezos, chainId, slug)
        )
        .sort(sortPredicate),
    [sortPredicate]
  );

  const enabledSlugsSorted = useMemoWithCompare(
    () => toSortedSlugs(enabledCollectibles),
    [enabledCollectibles, toSortedSlugs]
  );
  const otherSlugsSorted = useMemoWithCompare(
    () => toSortedSlugs(allAccountCollectibles.filter(({ status }) => status !== 'enabled')),
    [allAccountCollectibles, toSortedSlugs]
  );

  const evmMetadata = useEvmCollectiblesMetadataRecordSelector();
  const accountAddressForTezos = useAccountAddressForTezos();
  const accountAddressForEvm = useAccountAddressForEvm();

  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const tezMetadatasLoading = useCollectiblesMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesAreLoading();
  const evmMetadatasLoading = useEvmCollectiblesMetadataLoadingSelector();
  const { searchValueDebounced } = useSearchState();
  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const isSyncingLocal =
    (accountAddressForTezos
      ? tezAssetsLoading || tezMetadatasLoading || tezDetailsLoading || !tezDetailsReady
      : false) || (accountAddressForEvm ? evmBalancesLoading || evmMetadatasLoading : false);
  const [isSyncingDebounced] = useDebounce(isSyncingLocal, 500);
  const isSyncing = isSyncingLocal || isSyncingDebounced;

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

  const manageableChainSlugs = usePreservedOrderSlugsToManage(enabledSlugsSorted, otherSlugsSorted);

  const searchedSlugs = useMemoWithCompare(() => {
    let result = manageActive ? manageableChainSlugs : enabledSlugsSorted;

    if (isInSearchMode) {
      result = search(result);
    }

    if (!manageActive && selectedChains.length > 0) {
      result = result.filter(slug => selectedChains.includes(parseChainAssetSlug(slug)[1]));
    }

    return result;
  }, [isInSearchMode, search, manageableChainSlugs, manageActive, selectedChains, enabledSlugsSorted]);

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(searchedSlugs);

  const searchedSlugsByCollections = useMemo(() => {
    const slugsByCollectionsSlugs = new Map<string, string[]>();
    searchedSlugs.forEach(chainCollectibleSlug => {
      const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainCollectibleSlug);
      const [address] = fromAssetSlug(assetSlug);
      const collectionSlug = toChainAssetSlug(chainKind, chainId, toTokenSlug(address));
      let sameCollectionSlugs = slugsByCollectionsSlugs.get(collectionSlug);
      if (!sameCollectionSlugs) {
        sameCollectionSlugs = [];
        slugsByCollectionsSlugs.set(collectionSlug, sameCollectionSlugs);
      }
      sameCollectionSlugs.push(chainCollectibleSlug);
    });

    return Array.from(slugsByCollectionsSlugs.entries()).map(
      ([collectionSlug, chainCollectibleSlugs]): [CollectiblesCollection, string[]] => {
        const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainCollectibleSlugs[0]);
        let title: string | undefined;
        let logoSrc: string[] | undefined;
        if (chainKind === TempleChainKind.Tezos) {
          const details = allTezosCollectiblesDetails[assetSlug];
          if (details) {
            title = details.galleries[0]?.title ?? details.fa.name;
            logoSrc = buildTokenImagesStack(details.fa.logo);
          }
        } else {
          title = getCollectionName(getEvmMetadata(chainId as number, assetSlug));
        }

        return [{ chainId, title, logoSrc, collectionSlug }, chainCollectibleSlugs];
      }
    );
  }, [allTezosCollectiblesDetails, searchedSlugs, getEvmMetadata]);

  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);

  return {
    isInSearchMode,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchedSlugsByCollections,
    enabledCollectibles,
    tezDetailsReady
  };
};
