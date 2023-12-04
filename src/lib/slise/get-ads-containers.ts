import { AdType, ETHERSCAN_BUILTIN_ADS_WEBSITES } from 'lib/constants';

interface AdContainerProps {
  element: HTMLElement;
  width: number;
  height: number;
  type: AdType;
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
      size[dimension] = dimension === 'width' ? element.clientWidth : element.clientHeight;
    }
  }

  return size;
};

const mapBannersWithType = (banners: NodeListOf<Element>, type: AdType) =>
  [...banners].map(banner => ({ banner, type }));

export const getAdsContainers = () => {
  const locationUrl = window.parent.location.href;
  const builtInAdsImages = ETHERSCAN_BUILTIN_ADS_WEBSITES.some(urlPrefix => locationUrl.startsWith(urlPrefix))
    ? [...document.querySelectorAll('span + img')].filter(element => {
        const { width, height } = element.getBoundingClientRect();
        const label = element.previousElementSibling?.innerHTML ?? '';

        return (width > 0 || height > 0) && ['Featured', 'Ad'].includes(label);
      })
    : [];
  const coinzillaBanners = mapBannersWithType(
    document.querySelectorAll('iframe[src*="coinzilla.io"], iframe[src*="czilladx.com"]'),
    AdType.Coinzilla
  );
  const bitmediaBanners = mapBannersWithType(
    document.querySelectorAll('iframe[src*="media.bmcdn"], iframe[src*="cdn.bmcdn"]'),
    AdType.Bitmedia
  );
  const cointrafficBanners = mapBannersWithType(
    document.querySelectorAll('iframe[src*="ctengine.io"]'),
    AdType.Cointraffic
  );

  return builtInAdsImages
    .map((image): AdContainerProps | null => {
      const element = image.closest('div');

      return (
        element && {
          ...getFinalSize(image),
          element,
          type: AdType.EtherscanBuiltin
        }
      );
    })
    .concat(
      [...bitmediaBanners, ...coinzillaBanners, ...cointrafficBanners].map(({ banner, type }) => {
        const element = banner.parentElement?.closest('div') ?? null;

        return (
          element && {
            ...getFinalSize(banner),
            element,
            type
          }
        );
      })
    )
    .filter((element): element is AdContainerProps => Boolean(element));
};
