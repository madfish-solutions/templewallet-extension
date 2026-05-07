import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { noop } from 'lodash';
import type InfiniteScroll from 'react-infinite-scroll-component';

import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import { CollectiblesListItemElement, makeGetCollectionsElementsIndexesFunction } from 'lib/ui/collectibles-list';
import { OneOfChains } from 'temple/front';

import { CollectiblesCollection } from '../../types';
import { ListView } from '../list-view';

import { CollectionsListItem } from './item';

interface CollectionsListViewProps {
  collections: Array<[CollectiblesCollection, string[]]>;
  noCollectiblesAtAll: boolean;
  isSyncing: boolean;
  isInSearchMode: boolean;
  network?: OneOfChains;
  tezDetailsReady: boolean;
}

export const CollectionsListView = memo<CollectionsListViewProps>(
  ({ collections, noCollectiblesAtAll, isSyncing, isInSearchMode, network, tezDetailsReady }) => {
    const [openedCollections, setOpenedCollections] = useState<string[]>([]);
    const firstCollectionFirstItemRef = useRef<CollectiblesListItemElement>(null);
    const listRef = useRef<InfiniteScroll>(null);

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
          collections.map(([{ collectionSlug }, collectibles]) =>
            Math.min(collectibles.length, openedCollections.includes(collectionSlug) ? Infinity : 4)
          )
        ),
      [collections, openedCollections]
    );

    return (
      <ListView
        isEmpty={collections.length === 0}
        noCollectiblesAtAll={noCollectiblesAtAll}
        isSyncing={isSyncing}
        isInSearchMode={isInSearchMode}
        manageActive={false}
        network={network}
        collectiblesDetailsReady={tezDetailsReady}
      >
        <VisibilityTrackingInfiniteScroll getElementsIndexes={getElementsIndexes} loadNext={noop} ref={listRef}>
          {collections.map(([collection, chainSlugs], index) => (
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
  }
);
