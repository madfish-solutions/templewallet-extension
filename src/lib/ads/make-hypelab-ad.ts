import { TEMPLE_WALLET_AD_ATTRIBUTE_NAME } from 'lib/constants';
import { EnvVars } from 'lib/env';

import { AdsResolution } from './ads-resolutions';

export const makeHypelabAdElement = (adsResolution: AdsResolution, elementStyle: Record<string, string>) => {
  const { width, height, placementSlug } = adsResolution;
  const hypelabAdIframeBaseURL = EnvVars.HYPELAB_ADS_WINDOW_URL;

  const iframe = document.createElement('iframe');
  const queryParams = new URLSearchParams({
    w: String(width),
    h: String(height),
    p: placementSlug,
    o: window.location.href
  });
  iframe.src = `${hypelabAdIframeBaseURL}/?${queryParams.toString()}`;
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  iframe.style.border = 'none';
  for (const styleProp in elementStyle) {
    iframe.style.setProperty(styleProp, elementStyle[styleProp]);
  }
  iframe.setAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME, 'true');

  return iframe;
};
