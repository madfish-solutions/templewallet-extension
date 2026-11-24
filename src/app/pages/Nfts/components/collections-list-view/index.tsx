import { FC, useMemo, useRef, useState } from 'react';

import type InfiniteScroll from 'react-infinite-scroll-component';

import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import { useLoadedItemsCount, useRememberLoadedItemsCount } from 'app/hooks/use-loaded-items-count';
import { useSimplePaginationLogic } from 'app/hooks/use-simple-pagination-logic';
import { t } from 'lib/i18n';
import { CollectiblesListItemElement, makeGetCollectionsElementsIndexesFunction } from 'lib/ui/collectibles-list';
import { useAccountAddressForEvm } from 'temple/front';

import { CollectiblesCollection } from '../../types';
import { ListView } from '../list-view';

import { CollectionsListItem, requestEvmCollectionTokens } from './item';
import { isStorefrontPseudocollection, orderCollections } from './order-collections';

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
  const accountEvmAddress = useAccountAddressForEvm();
  const [openedCollections, setOpenedCollections] = useState<string[]>([]);
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

  const toggleCollectionOpened = (collectionSlug: string) => {
    const opening = !openedCollections.includes(collectionSlug);
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

    setOpenedCollections(prev =>
      prev.includes(collectionSlug) ? prev.filter(slug => slug !== collectionSlug) : prev.concat(collectionSlug)
    );
  };

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
