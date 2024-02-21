import type { SliseAdStylesOverrides } from 'lib/apis/temple';
import type { SliseAdsRules, SliseAdPlacesRule } from 'lib/slise/get-rules-content-script';

interface AdContainerProps extends Pick<SliseAdPlacesRule['selector'], 'shouldUseDivWrapper' | 'divWrapperStyle'> {
  element: HTMLElement;
  width: number;
  height: number;
  shouldNeglectSizeConstraints: boolean;
  stylesOverrides?: SliseAdStylesOverrides[];
}

const getFinalSize = (element: Element) => {
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

export const getAdsContainers = ({ providersSelector, adPlacesRules }: SliseAdsRules) => {
  const bannersFromProviders = [...document.querySelectorAll(providersSelector)];
  const adsContainers = adPlacesRules.reduce<AdContainerProps[]>((acc, { selector, stylesOverrides }) => {
    const { cssString, shouldUseDivWrapper, isMultiple, parentDepth, divWrapperStyle } = selector;
    const banners = isMultiple
      ? [...document.querySelectorAll(cssString)]
      : [document.querySelector(cssString)].filter((el): el is Element => Boolean(el));

    return acc.concat(
      banners
        .map((banner): AdContainerProps | null => {
          let element = banner;
          for (let i = 0; i < parentDepth; i++) {
            const parent = element.parentElement;

            if (!parent) {
              return null;
            }

            element = parent;
          }

          return {
            ...getFinalSize(element),
            element: element as HTMLElement,
            shouldUseDivWrapper,
            divWrapperStyle,
            shouldNeglectSizeConstraints: true,
            stylesOverrides
          };
        })
        .filter((value): value is AdContainerProps => Boolean(value))
    );
  }, []);
  bannersFromProviders.forEach(banner => {
    const element = banner.parentElement?.closest<HTMLElement>('div, article, aside, footer, header') ?? null;

    if (
      element &&
      !adsContainers.some(
        ({ element: duplicateCandidate }) =>
          duplicateCandidate.contains(element) || element.contains(duplicateCandidate)
      )
    ) {
      adsContainers.push({
        ...getFinalSize(banner),
        element,
        shouldUseDivWrapper: false,
        divWrapperStyle: {},
        shouldNeglectSizeConstraints: false
      });
    }
  });

  return adsContainers;
};
