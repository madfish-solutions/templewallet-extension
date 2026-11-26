import { FC, useMemo, useRef, useState } from 'react';

import { omit } from 'lodash';
import type InfiniteScroll from 'react-infinite-scroll-component';

import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import {
  useBackNavigationValue,
  useForgetBackNavigationValueOnInPlaceUnmount,
  useLoadedItemsCount,
  useRememberBackNavigationValue,
  useRememberLoadedItemsCount
} from 'app/hooks/use-loaded-items-count';
import { useSimplePaginationLogic } from 'app/hooks/use-simple-pagination-logic';
import { t } from 'lib/i18n';
import { CollectiblesListItemElement, makeGetCollectionsElementsIndexesFunction } from 'lib/ui/collectibles-list';
import { useAccountAddressForEvm } from 'temple/front';

import { CollectiblesCollection } from '../../types';
import { ListView } from '../list-view';

import { CollectionsListItem, requestEvmCollectionTokens, verifyShownEvmCollectionTokens } from './item';
import { isStorefrontPseudocollection, orderCollections } from './order-collections';

const COLLECTIONS_PER_PAGE = 10;
const COLLECTION_TILES_PER_PAGE = 40;
const SHOWN_TILES_BY_SLUG = new Map<string, StringRecord<number>>();

interface CollectionsListViewProps {
  collections: Array<[CollectiblesCollection, string[]]>;
  noCollectiblesAtAll: boolean;
  isSyncing: boolean;
  isInSearchMode: boolean;
  openCustomTokenModal: EmptyFn;
  tezDetailsReady: boolean;
}

export const CollectionsListView: FC<CollectionsListViewProps> = ({
  collections,
  noCollectiblesAtAll,
  isSyncing,
  isInSearchMode,
  openCustomTokenModal,
  tezDetailsReady
}) => {
  const accountEvmAddress = useAccountAddressForEvm();
  const restoredShownTiles = useBackNavigationValue(SHOWN_TILES_BY_SLUG, 'collections');
  const [shownTilesBySlug, setShownTilesBySlug] = useState<StringRecord<number>>(() => restoredShownTiles ?? {});
  useRememberBackNavigationValue(SHOWN_TILES_BY_SLUG, 'collections', shownTilesBySlug);
  useForgetBackNavigationValueOnInPlaceUnmount(SHOWN_TILES_BY_SLUG, 'collections');
  const firstCollectionFirstItemRef = useRef<CollectiblesListItemElement>(null);
  const listRef = useRef<InfiniteScroll>(null);
  const collectionsBySlug = new Map(collections.map(entry => [entry[0].collectionSlug, entry]));
  const orderedCollections = orderCollections(
    collections.map(([collection, chainSlugs]) => ({
      collectionSlug: collection.collectionSlug,
      chainSlugs,
      size: collection.ownedCount,
      pinnedToBottom: isStorefrontPseudocollection(collection.title, t('unknownCollection'), chainSlugs)
    }))
  ).flatMap(slug => {
    const entry = collectionsBySlug.get(slug);

    return entry ? [entry] : [];
  });

  const rememberedCount = useLoadedItemsCount('collections') ?? 0;
  const { paginatedItems: shownCollections, loadNext } = useSimplePaginationLogic(
    orderedCollections,
    [],
    COLLECTIONS_PER_PAGE,
    COLLECTIONS_PER_PAGE,
    Math.max(rememberedCount, COLLECTIONS_PER_PAGE)
  );
  useRememberLoadedItemsCount('collections', shownCollections.length);

  const verifyShownTiles = (collectionSlug: string, from: number, to: number) => {
    const entry = collectionsBySlug.get(collectionSlug);
    if (!entry || !accountEvmAddress) return;

    const [collection, chainSlugs] = entry;
    if (typeof collection.chainId !== 'number' || !collection.contractAddresses?.length) return;

    verifyShownEvmCollectionTokens(
      accountEvmAddress,
      collection.chainId,
      collection.contractAddresses,
      chainSlugs.slice(from, to)
    );
  };

  const toggleCollectionOpened = (collectionSlug: string) => {
    const opening = shownTilesBySlug[collectionSlug] === undefined;
    const collection = collectionsBySlug.get(collectionSlug)?.[0];

    if (
      opening &&
      accountEvmAddress &&
      collection &&
      typeof collection.chainId === 'number' &&
      collection.contractAddresses?.length
    )
      requestEvmCollectionTokens(accountEvmAddress, collection.chainId, collection.contractAddresses, {
        collectionSlug: collection.collectionSlug,
        title: collection.title
      });
    if (opening) verifyShownTiles(collectionSlug, 0, COLLECTION_TILES_PER_PAGE);

    setShownTilesBySlug(prev =>
      prev[collectionSlug] === undefined
        ? { ...prev, [collectionSlug]: COLLECTION_TILES_PER_PAGE }
        : omit(prev, collectionSlug)
    );
  };

  const showMoreTiles = (collectionSlug: string) => {
    const shown = shownTilesBySlug[collectionSlug];
    if (shown === undefined) return;

    verifyShownTiles(collectionSlug, shown, shown + COLLECTION_TILES_PER_PAGE);
    setShownTilesBySlug(prev => {
      const current = prev[collectionSlug];

      return current === undefined ? prev : { ...prev, [collectionSlug]: current + COLLECTION_TILES_PER_PAGE };
    });
  };

  const getElementsIndexes = useMemo(
    () =>
      makeGetCollectionsElementsIndexesFunction(
        listRef,
        firstCollectionFirstItemRef,
        shownCollections.map(([{ collectionSlug }, collectibles]) =>
          Math.min(collectibles.length, shownTilesBySlug[collectionSlug] ?? 4)
        )
      ),
    [shownCollections, shownTilesBySlug]
  );

  return (
    <ListView
      isEmpty={collections.length === 0}
      noCollectiblesAtAll={noCollectiblesAtAll}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      collectiblesDetailsReady={tezDetailsReady}
      openCustomTokenModal={openCustomTokenModal}
    >
      <VisibilityTrackingInfiniteScroll getElementsIndexes={getElementsIndexes} loadNext={loadNext} ref={listRef}>
        {shownCollections.map(([collection, chainSlugs], index) => (
          <CollectionsListItem
            key={collection.collectionSlug}
            collection={collection}
            chainSlugs={chainSlugs}
            index={index}
            shownTilesCount={shownTilesBySlug[collection.collectionSlug]}
            firstItemRef={index === 0 ? firstCollectionFirstItemRef : undefined}
            onToggleOpened={toggleCollectionOpened}
            onShowMoreTiles={showMoreTiles}
          />
        ))}
      </VisibilityTrackingInfiniteScroll>
    </ListView>
  );
};
