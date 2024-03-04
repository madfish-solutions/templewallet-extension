import { HYPELAB_NATIVE_AD_PLACEMENT_TYPE } from 'lib/constants';
import { EnvVars } from 'lib/env';

import { AdsResolution, ADS_RESOLUTIONS } from '../ads-resolutions';
import { HypelabPlacementType } from '../get-hypelab-iframe-url';

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

export const pickAdResolution = (
  containerWidth: number,
  containerHeight: number,
  shouldUseStrictContainerLimits: boolean,
  minContainerWidthIsBannerWidth: boolean,
  adIsNative: boolean
): AdsResolution | undefined => {
  if (containerWidth < 2 && containerHeight < 2) {
    return undefined;
  }

  if (adIsNative) {
    return {
      width: Math.max(160, containerWidth),
      height: Math.max(16, containerHeight),
      minContainerWidth: 2,
      minContainerHeight: 2,
      maxContainerWidth: Infinity,
      maxContainerHeight: Infinity,
      placementType: HYPELAB_NATIVE_AD_PLACEMENT_TYPE,
      placementSlug: EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG
    };
  }

  return ADS_RESOLUTIONS.find(
    ({ placementType, minContainerWidth, maxContainerWidth, minContainerHeight, maxContainerHeight, width }) => {
      const actualMinContainerWidth = minContainerWidthIsBannerWidth ? width : minContainerWidth;

      if (
        (placementType !== HypelabPlacementType.Small || shouldUseStrictContainerLimits) &&
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
    }
  );
};
