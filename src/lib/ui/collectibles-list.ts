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
    let fallbackElementHeight: number;
    if (manageActive) {
      fallbackElementHeight = 58;
    } else {
      fallbackElementHeight = showInfo ? 132 : 112;
    }
    const rowGapMultiplier = 1 + (manageActive ? 0 : 8) / fallbackElementHeight;
    const tokenElementHeight = (firstItemRef.current?.clientHeight ?? fallbackElementHeight) * rowGapMultiplier;
    const rowIndex = clamp(Math.floor(yAfterOffset / tokenElementHeight), 0, itemsCount - 1);

    return manageActive ? [rowIndex] : range(rowIndex * 3, rowIndex * 3 + 3);
  };
