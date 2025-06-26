import { RefObject } from 'react';

import { clamp } from 'lodash';

import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

export type TokenListItemElement = HTMLDivElement | HTMLAnchorElement;

export const makeGetTokenElementIndexFunction =
  (
    promoRef: RefObject<HTMLDivElement> | null,
    firstListItemRef: RefObject<TokenListItemElement>,
    slugsCount: number,
    takeTopOffset = true
  ) =>
  (y: number) => {
    const topOffset = takeTopOffset ? firstListItemRef.current?.offsetTop ?? 0 : 0;
    const yAfterOffset = y - topOffset;
    const promoElement = promoRef?.current;
    const promoHeight = promoElement?.clientHeight ?? 64;
    const tokenElementHeight = firstListItemRef.current?.clientHeight ?? 56;
    const indexWithoutPromo = clamp(Math.floor(yAfterOffset / tokenElementHeight), 0, slugsCount - 1);

    if (!promoElement || slugsCount < 5 || indexWithoutPromo < 2) {
      return [indexWithoutPromo];
    }

    const contentPromoAndAboveHeight = promoHeight + tokenElementHeight * 2;

    if (yAfterOffset < contentPromoAndAboveHeight) {
      return [1];
    }

    return [2 + Math.floor((yAfterOffset - contentPromoAndAboveHeight) / tokenElementHeight)];
  };

export const makeGroupedTokenElementIndexFunction =
  <T extends TempleChainKind>(
    promoRef: RefObject<HTMLDivElement>,
    firstListItemRef: RefObject<TokenListItemElement>,
    firstHeaderRef: RefObject<HTMLDivElement>,
    groupedSlugs: ChainGroupedSlugs<T>
  ) =>
  (y: number) => {
    const topOffset = firstHeaderRef.current?.offsetTop ?? 0;
    let slugsInPreviousGroupsCount = 0;
    let yLeft = y - topOffset;
    const promoElement = promoRef.current;
    const promoHeight = promoElement?.clientHeight ?? 64;
    const tokenElementHeight = firstListItemRef.current?.clientHeight ?? 56;
    const firstHeaderHeight = firstHeaderRef.current?.clientHeight ?? 26;
    for (let i = 0; i < groupedSlugs.length; i++) {
      const groupSlugsCount = groupedSlugs[i][1].length;
      const headerWithMarginsHeight = i === 0 ? firstHeaderHeight : Math.round((firstHeaderHeight * 20) / 13);
      const groupHeightWithoutPromo = headerWithMarginsHeight + tokenElementHeight * groupSlugsCount;
      const groupPromoHeight = i === 0 && promoElement ? promoHeight : 0;
      const groupHeight = groupHeightWithoutPromo + groupPromoHeight;

      if (groupHeight < yLeft) {
        slugsInPreviousGroupsCount += groupSlugsCount;
        yLeft -= groupHeight;
        continue;
      }

      if (yLeft < headerWithMarginsHeight) {
        return [slugsInPreviousGroupsCount];
      }

      yLeft -= headerWithMarginsHeight;
      const indexWithoutPromo = clamp(Math.floor(yLeft / tokenElementHeight), 0, groupSlugsCount - 1);

      if (!promoElement || groupSlugsCount < 5 || indexWithoutPromo < 2) {
        return [indexWithoutPromo + slugsInPreviousGroupsCount];
      }

      const contentPromoAndAboveHeight = groupPromoHeight + tokenElementHeight * 2;

      if (yLeft < contentPromoAndAboveHeight) {
        return [slugsInPreviousGroupsCount + 1];
      }

      return [slugsInPreviousGroupsCount + 2 + Math.floor((yLeft - contentPromoAndAboveHeight) / tokenElementHeight)];
    }

    return [slugsInPreviousGroupsCount - 1];
  };
