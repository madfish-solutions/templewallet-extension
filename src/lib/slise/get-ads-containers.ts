interface AdContainerProps {
  element: HTMLElement;
  width: number;
}

const getFinalWidth = (element: Element) => {
  const elementStyle = getComputedStyle(element);
  const rawWidthFromStyle = elementStyle.width;
  const rawWidthFromAttribute = element.getAttribute('width');

  return Number((rawWidthFromAttribute || rawWidthFromStyle).replace('px', '') || element.clientWidth);
};

export const getAdsContainers = () => {
  const builtInAdsImages = [...document.querySelectorAll('span + img')].filter(element => {
    const { width, height } = element.getBoundingClientRect();
    const label = element.previousElementSibling?.innerHTML ?? '';

    return (width > 0 || height > 0) && ['Featured', 'Ad'].includes(label);
  });
  const coinzillaBanners = [...document.querySelectorAll('.coinzilla')];
  const bitmediaBanners = [...document.querySelectorAll('iframe[src*="media.bmcdn"], iframe[src*="cdn.bmcdn"]')];

  return builtInAdsImages
    .map((image): AdContainerProps | null => {
      const element = image.closest('div');

      return element && { element, width: getFinalWidth(image) };
    })
    .concat(
      [...bitmediaBanners, ...coinzillaBanners].map(banner => {
        const parentElement = banner.parentElement;
        const closestDiv = parentElement?.closest('div') ?? null;
        const element = bitmediaBanners.includes(banner) ? closestDiv : parentElement;
        const widthDefinedElement = element?.parentElement ?? parentElement;
        const bannerFrame = banner.tagName === 'iframe' ? banner : banner.querySelector('iframe');

        return element && { element, width: getFinalWidth(bannerFrame || widthDefinedElement!) };
      })
    )
    .filter((element): element is AdContainerProps => Boolean(element));
};
