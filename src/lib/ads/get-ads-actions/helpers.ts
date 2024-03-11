import { EnvVars } from 'lib/env';

import { ADS_RESOLUTIONS } from '../ads-resolutions';

export const getFinalSize = (element: Element) => {
  const elementStyle = getComputedStyle(element);
  const { x, right, width: rectWidth, height: rectHeight } = element.getBoundingClientRect();
  const size = { width: rectWidth, height: rectHeight };
  const dimensions = ['width', 'height'] as const;

  for (const dimension of dimensions) {
    const rawDimensionFromStyle = elementStyle[dimension];
    const rawDimensionFromAttribute = element.getAttribute(dimension);
    const rawDimension = rawDimensionFromAttribute || rawDimensionFromStyle;

    if (/\d+px/.test(rawDimension)) {
      size[dimension] = Number(rawDimension.replace('px', ''));
    }
    if (dimension === 'width' && x < 0) {
      size.width += x;
    } else if (dimension === 'width' && right > window.innerWidth) {
      size.width = window.innerWidth - x;
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

export enum AdType {
  Permanent = 'permanent',
  SlotReplacement = 'slot-replacement',
  ProviderReplacement = 'provider-replacement'
}

export const pickAdResolution = (
  containerWidth: number,
  containerHeight: number,
  adType: AdType,
  adIsNative: boolean
) => {
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
      placementSlug: EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG
    };
  }

  const matchingResolutions = ADS_RESOLUTIONS.filter(
    ({ minContainerWidth, maxContainerWidth, minContainerHeight, maxContainerHeight, width }, i) => {
      switch (adType) {
        case AdType.Permanent:
          return i === 0 || (containerWidth >= width && (containerHeight >= minContainerHeight || containerHeight < 2));
        case AdType.SlotReplacement:
          return (
            i === 0 ||
            (containerWidth >= minContainerWidth && (containerHeight >= minContainerHeight || containerHeight < 2))
          );
        default:
          return (
            containerWidth >= minContainerWidth &&
            containerHeight >= minContainerHeight &&
            containerWidth <= maxContainerWidth &&
            containerHeight <= maxContainerHeight
          );
      }
    }
  );

  return matchingResolutions[matchingResolutions.length - 1];
};
