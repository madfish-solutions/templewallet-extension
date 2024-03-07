import { TEMPLE_WALLET_AD_ATTRIBUTE_NAME } from 'lib/constants';

import { AdMetadata, BANNER_ADS_META, buildHypeLabNativeMeta } from '../ads-meta';

import type { HideElementAction, InsertAdActionWithoutMeta, RemoveElementAction } from './types';

export type AddActionsIfAdResolutionAvailable = (
  elementToMeasure: Element,
  shouldUseStrictContainerLimits: boolean,
  minContainerWidthIsBannerWidth: boolean,
  adIsNative: boolean,
  ...actionsBases: (InsertAdActionWithoutMeta | HideElementAction | RemoveElementAction)[]
) => boolean;

export const ourAdQuerySelector = `iframe[${TEMPLE_WALLET_AD_ATTRIBUTE_NAME}], div[${TEMPLE_WALLET_AD_ATTRIBUTE_NAME}]`;

export const elementIsOurAd = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase();

  return (tagName === 'iframe' || tagName === 'div') && element.hasAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME);
};

export const getFinalSize = (element: Element) => {
  const elementStyle = getComputedStyle(element);
  const size = { width: 0, height: 0 };
  const dimensions = ['width', 'height'] as const;

  for (const dimension of dimensions) {
    const rawDimensionFromStyle = elementStyle[dimension];
    const rawDimensionFromAttribute = element.getAttribute(dimension);
    const rawDimension = rawDimensionFromAttribute || rawDimensionFromStyle;

    if (/\d+px/.test(rawDimension)) {
      size[dimension] = Number(rawDimension.replace('px', ''));
    } else {
      const { width, height } = element.getBoundingClientRect();
      size[dimension] = dimension === 'width' ? width : height;
    }
  }

  return size;
};

export const applyQuerySelector = <E extends Element = Element>(
  querySelector: string,
  isMultiple: boolean,
  element: Element | Document = document
) => {
  if (!querySelector) {
    return [];
  }

  return isMultiple
    ? [...element.querySelectorAll<E>(querySelector)]
    : [element.querySelector<E>(querySelector)].filter((el): el is E => Boolean(el));
};

export const getParentOfDepth = (element: HTMLElement, depth: number) => {
  let parent = element;

  for (let i = 0; i < depth; i++) {
    const nextParent = parent.parentElement;

    if (!nextParent) {
      return null;
    }

    parent = nextParent;
  }

  return parent;
};

export const pickAdsToDisplay = (
  containerWidth: number,
  containerHeight: number,
  shouldUseStrictContainerLimits: boolean,
  minContainerWidthIsBannerWidth: boolean,
  adIsNative: boolean
): AdMetadata[] => {
  if (containerWidth < 2 && containerHeight < 2) {
    return [];
  }

  if (adIsNative) {
    return [buildHypeLabNativeMeta(containerWidth, containerHeight)];
  }

  return BANNER_ADS_META.filter(({ source, dimensions }) => {
    const { minContainerWidth, maxContainerWidth, minContainerHeight, maxContainerHeight, width } = dimensions;

    const actualMinContainerWidth = minContainerWidthIsBannerWidth ? width : minContainerWidth;

    if (
      (shouldUseStrictContainerLimits || !source.shouldNotUseStrictContainerLimits) &&
      (containerWidth < actualMinContainerWidth || (containerHeight < minContainerHeight && containerHeight >= 2))
    ) {
      return false;
    }

    if (
      shouldUseStrictContainerLimits &&
      (containerWidth > maxContainerWidth || containerHeight > maxContainerHeight)
    ) {
      return false;
    }

    return true;
  });
};
