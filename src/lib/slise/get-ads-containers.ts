import type { SliseAdPlacesRule, SliseAdStylesOverrides } from 'lib/apis/temple';

export interface SliseAdsData {
  adPlacesRules: Array<Omit<SliseAdPlacesRule, 'urlRegexes'>>;
  providersSelector: string;
}

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

export const getAdsContainers = ({ providersSelector, adPlacesRules }: SliseAdsData) => {
  const bannersFromProviders = [...document.querySelectorAll(providersSelector)];
  const adsContainers = adPlacesRules.reduce<AdContainerProps[]>((acc, { selector, stylesOverrides }) => {
    const { cssString, shouldUseDivWrapper, isMultiple, parentDepth, divWrapperStyle } = selector;
    const banners = isMultiple
      ? [...document.querySelectorAll(cssString)]
      : [document.querySelector(cssString)].filter((el): el is Element => Boolean(el));
    acc.push(
      ...banners
        .map(banner => {
          let element = banner;
          for (let i = 0; i < parentDepth; i++) {
            const parent = element.parentElement;

            if (!parent) {
              break;
            }

            element = parent;
          }

          return (
            element && {
              ...getFinalSize(banner),
              element: element as HTMLElement,
              shouldUseDivWrapper,
              divWrapperStyle,
              shouldNeglectSizeConstraints: true,
              stylesOverrides
            }
          );
        })
        .filter(value => Boolean(value))
    );

    return acc;
  }, []);
  bannersFromProviders.forEach(banner => {
    const element = banner.parentElement?.closest<HTMLElement>('div, article, aside, footer, header') ?? null;

    if (
      element &&
      !adsContainers.some(
        ({ element: duplicateCandidate }) => duplicateCandidate === element || duplicateCandidate.contains(element)
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
