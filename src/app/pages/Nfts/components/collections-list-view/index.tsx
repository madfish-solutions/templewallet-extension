import { FC, useCallback, useMemo, useRef, useState } from 'react';

import { noop } from 'lodash';
import type InfiniteScroll from 'react-infinite-scroll-component';

import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import { t } from 'lib/i18n';
import { CollectiblesListItemElement, makeGetCollectionsElementsIndexesFunction } from 'lib/ui/collectibles-list';

import { CollectiblesCollection } from '../../types';
import { ListView } from '../list-view';

import { CollectionsListItem } from './item';
import { isStorefrontPseudocollection, orderCollections } from './order-collections';

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
  const collectionsBySlug = new Map(collections.map(entry => [entry[0].collectionSlug, entry]));
  const orderedCollections = orderCollections(
    collections.map(([collection, chainSlugs]) => ({
      collectionSlug: collection.collectionSlug,
      chainSlugs,
      pinnedToBottom: isStorefrontPseudocollection(collection.title, t('unknownCollection'), chainSlugs)
    }))
  ).flatMap(slug => {
    const entry = collectionsBySlug.get(slug);

    return entry ? [entry] : [];
  });

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
        orderedCollections.map(([{ collectionSlug }, collectibles]) =>
          Math.min(collectibles.length, openedCollections.includes(collectionSlug) ? Infinity : 4)
        )
      ),
    [orderedCollections, openedCollections]
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
      <VisibilityTrackingInfiniteScroll getElementsIndexes={getElementsIndexes} loadNext={noop} ref={listRef}>
        {orderedCollections.map(([collection, chainSlugs], index) => (
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
