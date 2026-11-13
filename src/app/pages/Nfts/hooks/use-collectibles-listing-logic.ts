import { useEffect, useRef } from 'react';

import { useDebounce } from 'use-debounce';

import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import {
  useCollectiblesManageState,
  useCollectiblesSearchState,
  useCollectiblesSelectedChainsState
} from 'app/hooks/use-assets-view-state';
import { useSimpleAssetsPaginationLogic } from 'app/hooks/use-simple-assets-pagination-logic';
import { dispatch } from 'app/store';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import {
  clearEvmCollectiblesSearchAction,
  loadEvmCollectiblesInventoryNextPageAction,
  searchEvmCollectiblesAction
} from 'app/store/evm/collectibles-inventory/actions';
import { isAlchemyChainId, isAlchemyOpenseaChainId } from 'app/store/evm/collectibles-inventory/chains';
import {
  useEvmCollectiblesInventoryLoadingSelector,
  useEvmCollectiblesInventorySelector,
  useEvmCollectiblesSearchSelector
} from 'app/store/evm/collectibles-inventory/selectors';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import {
  evmContractCollectionName,
  evmStoredCollectionName,
  isSharedStorefrontTokenId,
  singleContractCollectionNames
} from 'app/store/evm/collectibles-metadata/utils';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useAllCollectiblesDetailsSelector,
  useCollectiblesDetailsErrorSelector
} from 'app/store/tezos/collectibles/selectors';
import { CollectibleDetailsRecord } from 'app/store/tezos/collectibles/state';
import { AccountCollectible } from 'lib/assets/hooks/collectibles';
import { searchCollectiblesWithNoMeta } from 'lib/assets/search.utils';
import {
  fromAssetSlug,
  getTezCollectionName,
  parseChainAssetSlug,
  toChainAssetSlug,
  toTokenSlug
} from 'lib/assets/utils';
import { buildCollectionLogoSourceStages } from 'lib/images-uri';
import { useGetCollectibleMetadata, useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { getCollectionName as getEvmCollectionName } from 'lib/metadata/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useAccountAddressForEvm, useAccountAddressForTezos, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { CollectiblesCollection } from '../types';

import { alchemyInventoryCollections, loadedNftsFromSearchHits } from './inventory-collections';

type GetCollectionName = (chainKind: TempleChainKind, chainId: string | number, assetSlug: string) => string;

const groupSlugsByCollectionsInContracts = (chainCollectibleSlugs: string[], getCollectionName: GetCollectionName) => {
  const slugsByCollectionsInContracts = new Map<string, Map<string, string[]>>();

  chainCollectibleSlugs.forEach(chainCollectibleSlug => {
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

  return slugsByCollectionsInContracts;
};

const collectionEntriesFromGroups = (
  groups: Map<string, Map<string, string[]>>,
  tezosDetails: CollectibleDetailsRecord
): Array<[CollectiblesCollection, string[]]> =>
  Array.from(
    groups.entries().flatMap(([contractSlug, contractCollections]) =>
      contractCollections
        .entries()
        .map(([collectionName, chainCollectibleSlugs]): [CollectiblesCollection, string[]] => {
          const [chainKind, chainId, firstAssetSlug] = parseChainAssetSlug(chainCollectibleSlugs[0]);
          const logoSources =
            chainKind === TempleChainKind.Tezos
              ? buildCollectionLogoSourceStages(tezosDetails[firstAssetSlug]?.fa.logo)
              : undefined;

          return [
            {
              chainId,
              title: collectionName,
              logoSources,
              collectionSlug: `${contractSlug}_${collectionName}`,
              contractSlug
            },
            chainCollectibleSlugs
          ];
        })
    )
  );

const evmChainIdOfSlug = (slug: string) => {
  const [chainKind, chainId] = parseChainAssetSlug(slug);

  return chainKind === TempleChainKind.EVM && typeof chainId === 'number' ? chainId : undefined;
};

export const useCollectiblesListingLogic = (
  allAccountCollectibles: AccountCollectible[],
  sortPredicate: (aChainAssetSlug: string, bChainAssetSlug: string) => number
) => {
  const { manageActive } = useCollectiblesManageState();
  const { selectedChains } = useCollectiblesSelectedChainsState();
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
  const enabledEvmChains = useEnabledEvmChains();
  const inventoryByChain = useEvmCollectiblesInventorySelector(accountAddressForEvm);
  const inventoryLoading = useEvmCollectiblesInventoryLoadingSelector();
  const collectiblesSearch = useEvmCollectiblesSearchSelector();

  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const tezMetadatasLoading = useCollectiblesMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesAreLoading();
  const evmMetadatasLoading = useEvmCollectiblesMetadataLoadingSelector();
  const { searchValueDebounced } = useCollectiblesSearchState();
  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);
  const inventoryPending = Boolean(
    accountAddressForEvm &&
    enabledEvmChains.some(chain => isAlchemyChainId(chain.chainId) && !inventoryByChain[chain.chainId]?.settled)
  );

  const isSyncingLocal =
    (accountAddressForTezos
      ? tezAssetsLoading || tezMetadatasLoading || tezDetailsLoading || !tezDetailsReady
      : false) ||
    (accountAddressForEvm ? evmBalancesLoading || evmMetadatasLoading || inventoryLoading || inventoryPending : false);
  const [isSyncingDebounced] = useDebounce(isSyncingLocal, 500);
  const isSyncing = isSyncingLocal || isSyncingDebounced;

  const getTezMetadata = useGetCollectibleMetadata();

  const getEvmMetadata = (chainId: number, slug: string) => evmMetadata[chainId]?.[slug];
  const contractCollectionNames = singleContractCollectionNames(evmMetadata);
  const evmCollectionTitle = (chainId: number, assetSlug: string) => {
    const metadata = getEvmMetadata(chainId, assetSlug);
    const ownName = evmStoredCollectionName(metadata, assetSlug);
    if (isSharedStorefrontTokenId(fromAssetSlug(assetSlug)[1])) return ownName || getEvmCollectionName(undefined);

    return (
      evmContractCollectionName(contractCollectionNames, chainId, assetSlug, ownName) || getEvmCollectionName(metadata)
    );
  };

  const search = (slugs: string[]) =>
    searchCollectiblesWithNoMeta({
      searchValue: searchValueDebounced,
      assets: slugs,
      getTezMetadata: (_, slug) => getTezMetadata(slug),
      getEvmMetadata,
      getChainSlug: slug => slug,
      getSlug: getSlugFromChainSlug,
      getTezCollectionName: (_, slug) =>
        viewAsCollections ? getTezCollectionName(slug, allTezosCollectiblesDetails[slug]) : undefined,
      getEvmCollectionName: evmCollectionTitle
    });

  const manageableChainSlugs = usePreservedOrderSlugsToManage(enabledSlugsSorted, otherSlugsSorted);
  const searchReady =
    isInSearchMode && collectiblesSearch.searchQuery === searchValueDebounced && !collectiblesSearch.searchLoading;
  const enabledChainKey = enabledEvmChains.map(chain => chain.chainId).join();
  const selectedChainKey = selectedChains.join();
  const lastSearchKeyRef = useRef('');

  useEffect(() => {
    if (!accountAddressForEvm) return;

    const searchKey = `${accountAddressForEvm}|${searchValueDebounced}|${enabledChainKey}|${selectedChainKey}|${manageActive}`;
    if (lastSearchKeyRef.current === searchKey) return;
    lastSearchKeyRef.current = searchKey;

    if (!isInSearchMode || manageActive) {
      dispatch(clearEvmCollectiblesSearchAction());

      return;
    }

    const chainIds = (
      selectedChains.length === 0 ? enabledEvmChains.map(chain => chain.chainId) : selectedChains
    ).filter((chainId): chainId is number => typeof chainId === 'number' && isAlchemyChainId(chainId));

    dispatch(searchEvmCollectiblesAction({ account: accountAddressForEvm, chainIds, query: searchValueDebounced }));
  }, [
    accountAddressForEvm,
    enabledChainKey,
    enabledEvmChains,
    isInSearchMode,
    searchValueDebounced,
    manageActive,
    selectedChainKey,
    selectedChains
  ]);

  let searchedSlugs = manageActive ? manageableChainSlugs : enabledSlugsSorted;

  if (isInSearchMode && searchReady && !manageActive) {
    const localSlugs = searchedSlugs.filter(slug => {
      const chainId = evmChainIdOfSlug(slug);

      return chainId === undefined || !isAlchemyOpenseaChainId(chainId);
    });
    const hitSlugs = collectiblesSearch.searchHits
      .filter(hit => selectedChains.length === 0 || selectedChains.includes(hit.chainId))
      .map(hit => toChainAssetSlug(TempleChainKind.EVM, hit.chainId, hit.slug));

    searchedSlugs = Array.from(new Set(search(localSlugs).concat(hitSlugs)));
  } else if (isInSearchMode) {
    searchedSlugs = search(searchedSlugs);
  }

  const slugsBeforeChainFilter = searchedSlugs;

  if (!manageActive && selectedChains.length > 0) {
    searchedSlugs = searchedSlugs.filter(slug => selectedChains.includes(parseChainAssetSlug(slug)[1]));
  }

  const { slugs: paginatedSlugs, loadNext: loadNextWindow } = useSimpleAssetsPaginationLogic(searchedSlugs);
  const loadNext = () => {
    if (paginatedSlugs.length < searchedSlugs.length) {
      loadNextWindow();

      return;
    }

    if (!accountAddressForEvm || isInSearchMode) return;

    for (const chainIdKey of Object.keys(inventoryByChain)) {
      const chainId = Number(chainIdKey);
      const pageKey = inventoryByChain[chainId]?.nftPageKey;
      if (!pageKey || !isAlchemyChainId(chainId)) continue;
      if (selectedChains.length > 0 && !selectedChains.includes(chainId)) continue;

      dispatch(loadEvmCollectiblesInventoryNextPageAction({ account: accountAddressForEvm, chainId, pageKey }));
    }
  };

  const getCollectionName = (chainKind: TempleChainKind, chainId: string | number, assetSlug: string) =>
    chainKind === TempleChainKind.Tezos
      ? getTezCollectionName(assetSlug, allTezosCollectiblesDetails[assetSlug])
      : evmCollectionTitle(chainId as number, assetSlug);

  const groupedSlugs = slugsBeforeChainFilter.filter(slug => {
    const chainId = evmChainIdOfSlug(slug);

    return chainId === undefined || !isAlchemyChainId(chainId);
  });
  const slugsByCollectionsInContracts = groupSlugsByCollectionsInContracts(groupedSlugs, getCollectionName);

  const unsortedSearchedSlugsByCollections = useMemoWithCompare(
    () => collectionEntriesFromGroups(slugsByCollectionsInContracts, allTezosCollectiblesDetails),
    [allTezosCollectiblesDetails, slugsByCollectionsInContracts]
  );
  const allowedCollectionSlugs = isInSearchMode ? new Set(searchedSlugs) : undefined;
  const inventoryCollectionEntries = accountAddressForEvm
    ? Object.keys(inventoryByChain).flatMap(chainIdKey => {
        const chainId = Number(chainIdKey);
        const inventory = inventoryByChain[chainId];
        if (!inventory?.settled || !isAlchemyChainId(chainId)) return [];

        return alchemyInventoryCollections(chainId, inventory, {
          searching: isInSearchMode,
          allowedSlugs: allowedCollectionSlugs,
          extraLoaded: searchReady ? loadedNftsFromSearchHits(collectiblesSearch.searchHits, chainId) : []
        });
      })
    : [];
  const allCollectionEntries = unsortedSearchedSlugsByCollections.concat(inventoryCollectionEntries);
  const searchedSlugsByCollections =
    !manageActive && selectedChains.length > 0
      ? allCollectionEntries.filter(([collection]) => selectedChains.includes(collection.chainId))
      : allCollectionEntries;
  const chipSlugGroups = groupSlugsByCollectionsInContracts(
    enabledSlugsSorted.filter(slug => {
      const chainId = evmChainIdOfSlug(slug);

      return chainId === undefined || !isAlchemyChainId(chainId);
    }),
    getCollectionName
  );
  const chipCollections = useMemoWithCompare(() => {
    const inventoryEntries = accountAddressForEvm
      ? Object.keys(inventoryByChain).flatMap(chainIdKey => {
          const chainId = Number(chainIdKey);
          const inventory = inventoryByChain[chainId];
          if (!inventory?.settled || !isAlchemyChainId(chainId)) return [];

          return alchemyInventoryCollections(chainId, inventory, { searching: false });
        })
      : [];

    return collectionEntriesFromGroups(chipSlugGroups, allTezosCollectiblesDetails).concat(inventoryEntries);
  }, [accountAddressForEvm, allTezosCollectiblesDetails, chipSlugGroups, inventoryByChain]);

  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);

  return {
    isInSearchMode,
    noCollectiblesAtAll: (manageActive ? manageableChainSlugs : enabledSlugsSorted).length === 0,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchedSlugsByCollections,
    chipCollections,
    tezDetailsReady
  };
};
