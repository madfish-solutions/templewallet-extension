import React from 'react';

import debounce from 'debounce';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import { AdType, ContentScriptType, ETHERSCAN_BUILTIN_ADS_WEBSITES, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { getAdsContainers } from 'lib/slise/get-ads-containers';
import { getSlotId } from 'lib/slise/get-slot-id';
import { SliseAd } from 'lib/slise/slise-ad';

const availableAdsResolutions = [
  { width: 270, height: 90 },
  { width: 728, height: 90 }
];

let oldHref = '';

const replaceAds = debounce(
  () => {
    try {
      const adsContainers = getAdsContainers();
      const adsContainersToReplace = adsContainers.filter(
        ({ width, height }) =>
          ((width >= 600 && width <= 900) || (width >= 180 && width <= 430)) && height >= 60 && height <= 120
      );

      const newHref = window.parent.location.href;
      if (oldHref !== newHref && adsContainersToReplace.length > 0) {
        oldHref = newHref;

        browser.runtime.sendMessage({
          type: ContentScriptType.ExternalAdsActivity,
          url: window.parent.location.origin
        });
      }

      adsContainersToReplace.forEach(({ element: adContainer, width: containerWidth, type }) => {
        let adsResolution = availableAdsResolutions[0];
        for (let i = 1; i < availableAdsResolutions.length; i++) {
          const candidate = availableAdsResolutions[i];
          if (candidate.width <= containerWidth && candidate.width > adsResolution.width) {
            adsResolution = candidate;
          }
        }

        if (
          ETHERSCAN_BUILTIN_ADS_WEBSITES.some(urlPrefix => newHref.startsWith(urlPrefix)) &&
          type === AdType.Coinzilla
        ) {
          adContainer.style.textAlign = 'left';
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
