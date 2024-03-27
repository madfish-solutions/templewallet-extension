import { HypelabBannerAd } from '../../types';

export function getHypelabBannerAd(element: HTMLElement): HypelabBannerAd | null {
  // @ts-expect-error
  return element.ad;
}
