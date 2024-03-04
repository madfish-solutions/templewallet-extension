import { AdMetadata, BANNER_ADS_META, isHypeLabBannerSource, buildHypeLabNativeMeta } from '../ads-meta';

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

export const pickAdToDisplay = (
  containerWidth: number,
  containerHeight: number,
  shouldUseStrictContainerLimits: boolean,
  minContainerWidthIsBannerWidth: boolean,
  adIsNative: boolean
): AdMetadata | undefined => {
  if (containerWidth < 2 && containerHeight < 2) {
    return undefined;
  }

  if (adIsNative) {
    return buildHypeLabNativeMeta(containerWidth, containerHeight);
  }

  return BANNER_ADS_META.find(({ source, dimensions }) => {
    const { minContainerWidth, maxContainerWidth, minContainerHeight, maxContainerHeight, width } = dimensions;

    const actualMinContainerWidth = minContainerWidthIsBannerWidth ? width : minContainerWidth;

    if (
      (shouldUseStrictContainerLimits || !isHypeLabBannerSource(source) || source.size !== 'small') &&
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
