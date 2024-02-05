const availableAdsResolutions = [
  {
    width: 600,
    height: 160,
    minContainerWidth: 500,
    maxContainerWidth: 700,
    minContainerHeight: 120,
    maxContainerHeight: 200
  },
  {
    width: 300,
    height: 250,
    minContainerWidth: 200,
    maxContainerWidth: 400,
    minContainerHeight: 200,
    maxContainerHeight: 450
  },
  {
    width: 970,
    height: 90,
    minContainerWidth: 800,
    maxContainerWidth: 1100,
    minContainerHeight: 60,
    maxContainerHeight: 120
  }
];

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

export const pickAdRect = (
  containerWidth: number,
  containerHeight: number,
  shouldUseStrictContainerLimits: boolean,
  minContainerWidthIsBannerWidth: boolean
) => {
  if (containerWidth < 2 && containerHeight < 2) {
    return undefined;
  }

  const matchingResolutions = availableAdsResolutions.filter(
    ({ minContainerWidth, maxContainerWidth, minContainerHeight, maxContainerHeight, width }, i) => {
      const actualMinContainerWidth = minContainerWidthIsBannerWidth ? width : minContainerWidth;

      if ((i !== 0 || shouldUseStrictContainerLimits) && containerWidth < actualMinContainerWidth) {
        return false;
      }

      if (
        shouldUseStrictContainerLimits &&
        (containerHeight < minContainerHeight ||
          containerWidth > maxContainerWidth ||
          containerHeight > maxContainerHeight)
      ) {
        return false;
      }

      return true;
    }
  );
  const resolution = matchingResolutions[matchingResolutions.length - 1];

  return (
    resolution && {
      width: resolution.width,
      height: resolution.height
    }
  );
};
