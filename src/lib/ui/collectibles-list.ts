import { RefObject } from 'react';

import { clamp, range } from 'lodash';
import type InfiniteScroll from 'react-infinite-scroll-component';

export type CollectiblesListItemElement = HTMLDivElement | HTMLAnchorElement;

export const makeGetCollectiblesElementsIndexesFunction =
  (
    firstItemRef: RefObject<CollectiblesListItemElement | null>,
    itemsCount: number,
    showInfo: boolean,
    manageActive: boolean
  ) =>
  (y: number) => {
    const topOffset = firstItemRef.current?.offsetTop ?? 0;
    const yAfterOffset = y - topOffset;
    const rowGapMultiplier = 1 + (manageActive ? 0 : 8 / (showInfo ? 132 : 112));
    const tokenElementHeight =
      (firstItemRef.current?.clientHeight ?? (manageActive ? 62 : showInfo ? 132 : 112)) * rowGapMultiplier;
    const rowIndex = clamp(
      Math.floor(yAfterOffset / tokenElementHeight),
      0,
      (manageActive ? itemsCount : Math.ceil(itemsCount / 3)) - 1
    );

    return manageActive ? [rowIndex] : range(rowIndex * 3, rowIndex * 3 + 3);
  };

export const makeGetCollectionsElementsIndexesFunction =
  (
    listRef: RefObject<InfiniteScroll | null>,
    firstCollectionFirstItemRef: RefObject<CollectiblesListItemElement | null>,
    collectionsItemsCounters: number[]
  ) =>
  (y: number) => {
    // @ts-expect-error: accessing private property
    const scrollElement = listRef.current?._infScroll;
    const listTopOffset = scrollElement?.offsetTop ?? 0;
    const collectionHeaderHeight =
      scrollElement && firstCollectionFirstItemRef.current
        ? firstCollectionFirstItemRef.current.offsetTop - listTopOffset
        : 56;
    const collectibleElementHeightWithoutGap = firstCollectionFirstItemRef.current?.clientHeight ?? 96;
    const gapsMultiplier = collectionHeaderHeight / 56;
    let heightLeft = y - listTopOffset;
    const collectionBottomHeight = 28 * gapsMultiplier;
    for (let i = 0; i < collectionsItemsCounters.length; i++) {
      const collectiblesRowsCount = Math.ceil(collectionsItemsCounters[i] / 4);
      const collectiblesGridHeight =
        collectiblesRowsCount * collectibleElementHeightWithoutGap + (collectiblesRowsCount - 1) * 8 * gapsMultiplier;
      const totalHeight = collectionHeaderHeight + collectiblesGridHeight + collectionBottomHeight;
      heightLeft -= totalHeight;

      if (heightLeft <= 0) {
        return [i];
      }
    }

    return [collectionsItemsCounters.length - 1];
  };
