import browser from 'webextension-polyfill';

import { getAdsContainers } from 'lib/ads/get-ads-containers';
import { AdType, ContentScriptType, ETHERSCAN_BUILTIN_ADS_WEBSITES, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { EnvVars } from 'lib/env';

interface AdsResolution {
  width: number;
  height: number;
  minContainerWidth: number;
  minContainerHeight: number;
  maxContainerWidth: number;
  maxContainerHeight: number;
  placementSlug: string;
}

const availableAdsResolutions = [
  {
    width: 320,
    height: 50,
    minContainerWidth: 230,
    minContainerHeight: 32,
    maxContainerWidth: 480,
    maxContainerHeight: 120,
    placementSlug: EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG
  },
  {
    width: 300,
    height: 250,
    minContainerWidth: 210,
    minContainerHeight: 170,
    maxContainerWidth: 400,
    maxContainerHeight: 300,
    placementSlug: EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG
  },
  {
    width: 728,
    height: 90,
    minContainerWidth: 600,
    minContainerHeight: 60,
    maxContainerWidth: 900,
    maxContainerHeight: 120,
    placementSlug: EnvVars.HYPELAB_WIDE_PLACEMENT_SLUG
  }
];

const resolutionMatchesContainer = (resolution: AdsResolution, containerWidth: number, containerHeight: number) =>
  resolution.minContainerWidth <= containerWidth &&
  resolution.minContainerHeight <= containerHeight &&
  resolution.maxContainerWidth >= containerWidth &&
  resolution.maxContainerHeight >= containerHeight;

let oldHref = '';

let processing = false;

const replaceAds = async () => {
  if (processing) return;
  processing = true;

  try {
    const adsContainers = getAdsContainers();
    const adsContainersToReplace = adsContainers.filter(({ width, height }) =>
      availableAdsResolutions.some(resolution => resolutionMatchesContainer(resolution, width, height))
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
    const HypelabAdModule = await import('lib/ads/hypelab-ad');

    adsContainersToReplace.forEach(({ element: adContainer, width: containerWidth, height: containerHeight, type }) => {
      let adsResolution = availableAdsResolutions[0];
      for (let i = 1; i < availableAdsResolutions.length; i++) {
        const candidate = availableAdsResolutions[i];
        if (resolutionMatchesContainer(candidate, containerWidth, containerHeight)) {
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
      adRoot.render(HypelabAdModule.buildHypelabBannerReactNode(adsResolution.placementSlug, true));
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
