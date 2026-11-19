import { FC, useCallback, useMemo, useRef, useState } from 'react';

import type InfiniteScroll from 'react-infinite-scroll-component';

import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import { useLoadedItemsCount, useRememberLoadedItemsCount } from 'app/hooks/use-loaded-items-count';
import { useSimplePaginationLogic } from 'app/hooks/use-simple-pagination-logic';
import { CollectiblesListItemElement, makeGetCollectionsElementsIndexesFunction } from 'lib/ui/collectibles-list';

import { CollectiblesCollection } from '../../types';
import { ListView } from '../list-view';

import { CollectionsListItem } from './item';

const COLLECTIONS_PER_PAGE = 10;

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
  const [openedCollections, setOpenedCollections] = useState<string[]>([]);
  const firstCollectionFirstItemRef = useRef<CollectiblesListItemElement>(null);
  const listRef = useRef<InfiniteScroll>(null);
  const rememberedCount = useLoadedItemsCount('collections') ?? 0;
  const { paginatedItems: shownCollections, loadNext } = useSimplePaginationLogic(
    collections,
    [],
    COLLECTIONS_PER_PAGE,
    COLLECTIONS_PER_PAGE,
    Math.max(rememberedCount, COLLECTIONS_PER_PAGE)
  );
  useRememberLoadedItemsCount('collections', shownCollections.length);

  const toggleCollectionOpened = useCallback((collectionSlug: string) => {
    setOpenedCollections(prev =>
      prev.includes(collectionSlug) ? prev.filter(slug => slug !== collectionSlug) : prev.concat(collectionSlug)
    );
  }, []);

  const getElementsIndexes = useMemo(
    () =>
      makeGetCollectionsElementsIndexesFunction(
        listRef,
        firstCollectionFirstItemRef,
        shownCollections.map(([{ collectionSlug }, collectibles]) =>
          Math.min(collectibles.length, openedCollections.includes(collectionSlug) ? Infinity : 4)
        )
      ),
    [shownCollections, openedCollections]
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
            opened={openedCollections.includes(collection.collectionSlug)}
            firstItemRef={index === 0 ? firstCollectionFirstItemRef : undefined}
            onToggleOpened={toggleCollectionOpened}
          />
        ))}
      </VisibilityTrackingInfiniteScroll>
    </ListView>
  );
};
