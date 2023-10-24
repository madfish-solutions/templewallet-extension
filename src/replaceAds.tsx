import React from 'react';

import debounce from 'debounce';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import { getAdsContainers } from 'lib/slise/get-ads-containers';
import { getSlotId } from 'lib/slise/get-slot-id';
import { SliseAd } from 'lib/slise/slise-ad';

const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

const availableAdsResolutions = [
  { width: 270, height: 90 },
  { width: 728, height: 90 }
];

const replaceAds = debounce(
  () => {
    try {
      const adsContainers = getAdsContainers();

      adsContainers.forEach(({ element: adContainer, width: containerWidth }) => {
        let adsResolution = availableAdsResolutions[0];
        for (let i = 1; i < availableAdsResolutions.length; i++) {
          const candidate = availableAdsResolutions[i];
          if (candidate.width <= containerWidth && candidate.width > adsResolution.width) {
            adsResolution = candidate;
          }
        }

        const adRoot = createRoot(adContainer);
        adRoot.render(
          <SliseAd slotId={getSlotId()} pub="pub-25" width={adsResolution.width} height={adsResolution.height} />
        );
      });
    } catch {}
  },
  100,
  true
);

// Prevents the script from running in an Iframe
if (window.frameElement === null) {
  browser.storage.local.get(WEBSITES_ANALYTICS_ENABLED).then(storage => {
    if (storage[WEBSITES_ANALYTICS_ENABLED]) {
      // Replace ads with those from Slise
      window.addEventListener('load', () => replaceAds());
      window.addEventListener('ready', () => replaceAds());
      setInterval(() => replaceAds(), 1000);
      replaceAds();
    }
  });
}
