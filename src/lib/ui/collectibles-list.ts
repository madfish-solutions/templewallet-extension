import { RefObject } from 'react';

import { clamp, range } from 'lodash';

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
    const rowGapMultiplier = 1 + 8 / (showInfo ? 132 : 112);
    const tokenElementHeight = (firstItemRef.current?.clientHeight ?? (showInfo ? 132 : 112)) * rowGapMultiplier;
    const rowIndex = clamp(Math.floor(yAfterOffset / tokenElementHeight), 0, itemsCount - 1);

    return manageActive ? [rowIndex] : range(rowIndex * 3, rowIndex * 3 + 3);
  };
