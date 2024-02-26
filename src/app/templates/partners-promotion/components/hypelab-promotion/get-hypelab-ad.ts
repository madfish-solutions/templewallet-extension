import { BannerElement, NativeElement } from '@hypelab/sdk-react';

import { HypelabBannerAd, HypelabNativeAd } from '../../types';

export function getHypelabAd(element: BannerElement): HypelabBannerAd | null;
export function getHypelabAd(element: NativeElement): HypelabNativeAd | null;
export function getHypelabAd(element: BannerElement | NativeElement): HypelabBannerAd | HypelabNativeAd | null {
  // @ts-expect-error
  return element.ad;
}
