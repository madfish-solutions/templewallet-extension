import browser from 'webextension-polyfill';

import { AdsResolution } from './ads-resolutions';

export const mountHypelabAd = (element: HTMLElement, adsResolution: AdsResolution, displayBlock = false) => {
  const { width, height, placementSlug } = adsResolution;
  const hypelabAdIframeBaseURL = browser.runtime.getURL('hypelab-ad.html');

  if (element.querySelector(`iframe[src^="${hypelabAdIframeBaseURL}"]`)) {
    console.warn('Hypelab ad already mounted');

    return;
  }

  const iframe = document.createElement('iframe');
  iframe.src = `${hypelabAdIframeBaseURL}#?w=${width}&h=${height}&p=${placementSlug}`;
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  iframe.style.border = 'none';
  if (displayBlock) {
    iframe.style.display = 'block';
  }
  iframe.setAttribute('slise-ad-container', 'true');

  element.replaceChildren(iframe);
};
