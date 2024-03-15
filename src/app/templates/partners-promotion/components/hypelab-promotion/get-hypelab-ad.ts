import { HypelabBannerAd, HypelabNativeAd } from '../../types';

export function getHypelabBannerAd(element: HTMLElement) {
  return getAdProperty(element) as HypelabBannerAd | null;
}

export function getHypelabNativeAd(element: HTMLElement) {
  return getAdProperty(element) as HypelabNativeAd | null;
}

/** Not doable through function overrides.
 * See: https://stackoverflow.com/questions/78063160/typescript-doesnt-care-about-instanceof-in-function-overrides
 */
function getAdProperty(element: HTMLElement): unknown {
  // @ts-expect-error
  return element.ad;
}
