import { useDebounce } from 'use-debounce';

import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import { useManageState, useSearchState, useSelectedChainsState } from 'app/hooks/use-collectibles-view-state';
import { useSimpleAssetsPaginationLogic } from 'app/hooks/use-simple-assets-pagination-logic';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
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
import { searchCollectiblesWithNoMeta } from 'lib/assets/search.utils';
import {
  fromAssetSlug,
  getTezCollectionName,
  parseChainAssetSlug,
  toChainAssetSlug,
  toTokenSlug
} from 'lib/assets/utils';
import { buildTokenImagesStack } from 'lib/images-uri';
import { useGetCollectibleMetadata, useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { getCollectionName as getEvmCollectionName } from 'lib/metadata/utils';
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
  const { viewAsCollections } = useCollectiblesListOptionsSelector();
  const tezDetailsReady =
    Boolean(tezDetailsError) ||
    Object.keys(allTezosCollectiblesDetails).length > 0 ||
    allAccountCollectibles.every(({ status, chainId }) => status !== 'enabled' || typeof chainId === 'number');

  const enabledCollectibles = allAccountCollectibles.filter(({ status }) => status === 'enabled');

  const tezEnabledCollectiblesChainsSlugs = useMemoWithCompare(
    () =>
      enabledCollectibles
        .filter(({ chainId }) => typeof chainId === 'string')
        .map(({ slug, chainId }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)),
    [enabledCollectibles]
  );
  const toSortedSlugs = (collectibles: AccountCollectible[]) =>
    collectibles
      .map(({ slug, chainId }) =>
        toChainAssetSlug(typeof chainId === 'number' ? TempleChainKind.EVM : TempleChainKind.Tezos, chainId, slug)
      )
      .sort(sortPredicate);

  const enabledSlugsSorted = toSortedSlugs(enabledCollectibles);
  const otherSlugsSorted = toSortedSlugs(allAccountCollectibles.filter(({ status }) => status !== 'enabled'));

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

  const getEvmMetadata = (chainId: number, slug: string) => evmMetadata[chainId]?.[slug];

  const search = (slugs: string[]) =>
    searchCollectiblesWithNoMeta({
      searchValue: searchValueDebounced,
      assets: slugs,
      getTezMetadata: (_, slug) => getTezMetadata(slug),
      getEvmMetadata,
      getChainSlug: slug => slug,
      getSlug: getSlugFromChainSlug,
      getTezCollectionName: (_, slug) =>
        viewAsCollections ? getTezCollectionName(slug, allTezosCollectiblesDetails[slug]) : undefined
    });

  const manageableChainSlugs = usePreservedOrderSlugsToManage(enabledSlugsSorted, otherSlugsSorted);

  let searchedSlugs = manageActive ? manageableChainSlugs : enabledSlugsSorted;

  if (isInSearchMode) {
    searchedSlugs = search(searchedSlugs);
  }

  if (!manageActive && selectedChains.length > 0) {
    searchedSlugs = searchedSlugs.filter(slug => selectedChains.includes(parseChainAssetSlug(slug)[1]));
  }

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(searchedSlugs);

  const getCollectionName = (chainKind: TempleChainKind, chainId: string | number, assetSlug: string) =>
    chainKind === TempleChainKind.Tezos
      ? getTezCollectionName(assetSlug, allTezosCollectiblesDetails[assetSlug])
      : getEvmCollectionName(getEvmMetadata(chainId as number, assetSlug));

  const slugsByCollectionsInContracts = new Map<string, Map<string, string[]>>();
  searchedSlugs.forEach(chainCollectibleSlug => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainCollectibleSlug);
    const [address] = fromAssetSlug(assetSlug);
    const contractSlug = toChainAssetSlug(chainKind, chainId, toTokenSlug(address));
    const collectionName = getCollectionName(chainKind, chainId, assetSlug);
    let sameContractCollections = slugsByCollectionsInContracts.get(contractSlug);
    if (!sameContractCollections) {
      sameContractCollections = new Map<string, string[]>();
      slugsByCollectionsInContracts.set(contractSlug, sameContractCollections);
    }
    let sameCollectionSlugs = sameContractCollections.get(collectionName);
    if (!sameCollectionSlugs) {
      sameCollectionSlugs = [];
      sameContractCollections.set(collectionName, sameCollectionSlugs);
    }
    sameCollectionSlugs.push(chainCollectibleSlug);
  });

  const searchedSlugsByCollections = Array.from(
    slugsByCollectionsInContracts.entries().flatMap(([contractSlug, contractCollections]) =>
      contractCollections
        .entries()
        .map(([collectionName, chainCollectibleSlugs]): [CollectiblesCollection, string[]] => {
          const [chainKind, chainId, firstAssetSlug] = parseChainAssetSlug(chainCollectibleSlugs[0]);
          const logoSrc =
            chainKind === TempleChainKind.Tezos
              ? buildTokenImagesStack(allTezosCollectiblesDetails[firstAssetSlug]?.fa.logo)
              : undefined;

          return [
            { chainId, title: collectionName, logoSrc, collectionSlug: `${contractSlug}_${collectionName}` },
            chainCollectibleSlugs
          ];
        })
    )
  );

  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);

  return {
    isInSearchMode,
    noCollectiblesAtAll: (manageActive ? manageableChainSlugs : enabledSlugsSorted).length === 0,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchedSlugsByCollections,
    enabledCollectibles,
    tezDetailsReady
  };
};
