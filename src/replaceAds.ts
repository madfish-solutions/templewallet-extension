import browser from 'webextension-polyfill';

import { AdType, ContentScriptType, ETHERSCAN_BUILTIN_ADS_WEBSITES, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { getAdsContainers } from 'lib/slise/get-ads-containers';

const availableAdsResolutions = [
  { width: 270, height: 90 },
  { width: 728, height: 90 }
];

let oldHref = '';

let processing = false;

const replaceAds = async () => {
  if (processing) return;
  processing = true;

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

    if (!adsContainersToReplace.length) {
      processing = false;
      return;
    }

    const ReactDomModule = await import('react-dom/client');
    const SliceAdModule = await import('lib/slise/slise-ad');

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

      const adRoot = ReactDomModule.createRoot(adContainer);
      adRoot.render(SliceAdModule.buildSliceAdReactNode(adsResolution.width, adsResolution.height));
    });
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }

  processing = false;
};

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
