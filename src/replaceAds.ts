import memoize from 'p-memoize';
import browser from 'webextension-polyfill';

import { ContentScriptType, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { getAdsContainers, SliseAdsData } from 'lib/slise/get-ads-containers';
import { mountSliseAd } from 'lib/slise/mount-slise-ad';
import { TempleMessageType, TempleResponse } from 'lib/temple/types';

import { getIntercom } from './intercom-client';

const availableAdsResolutions = [
  { width: 270, height: 90 },
  { width: 728, height: 90 }
];

let oldHref = '';

let processing = false;

const getSliseAdsData = memoize(
  async (location: Location) => {
    const { hostname, href } = location;

    return new Promise<SliseAdsData>((resolve, reject) => {
      getIntercom()
        .request({
          type: TempleMessageType.ExternalAdsDataRequest,
          hostname,
          href
        })
        .then((res: TempleResponse) => {
          if (res?.type === TempleMessageType.ExternalAdsDataResponse) {
            resolve(res.data);
          }
        })
        .catch(reject);
    });
  },
  { cacheKey: ([{ hostname, href }]) => `${hostname} ${href}`, maxAge: 3600 * 1000 }
);

const sizeMatchesConstraints = (width: number, height: number) =>
  ((width >= 600 && width <= 900) || (width >= 180 && width <= 430)) && height >= 60 && height <= 120;

const containerIsRenderedProperly = (width: number, height: number) => width > 1 || height > 1;

const overrideElementStyles = (element: HTMLElement, overrides: Record<string, string>) => {
  for (const stylePropName in overrides) {
    element.style.setProperty(stylePropName, overrides[stylePropName]);
  }
};

const replaceAds = async () => {
  if (processing) return;
  processing = true;

  try {
    const sliseAdsData = await getSliseAdsData(window.parent.location);

    const adsContainers = getAdsContainers(sliseAdsData);
    const adsContainersToReplace = adsContainers.filter(
      ({ width, height, shouldNeglectSizeConstraints }) =>
        (shouldNeglectSizeConstraints && containerIsRenderedProperly(width, height)) ||
        sizeMatchesConstraints(width, height)
    );

    const newHref = window.parent.location.href;
    if (oldHref !== newHref && adsContainersToReplace.length > 0) {
      oldHref = newHref;

      browser.runtime
        .sendMessage({
          type: ContentScriptType.ExternalAdsActivity,
          url: window.parent.location.origin
        })
        .catch(console.error);
    }

    if (!adsContainersToReplace.length) {
      processing = false;
      return;
    }

    console.log('oy vey 1', adsContainersToReplace);
    await Promise.all(
      adsContainersToReplace.map(
        async ({ element, width: containerWidth, shouldUseDivWrapper, divWrapperStyle = {}, stylesOverrides = [] }) => {
          stylesOverrides.sort((a, b) => a.parentDepth - b.parentDepth);
          let adsResolution = availableAdsResolutions[0];
          for (let i = 1; i < availableAdsResolutions.length; i++) {
            const candidate = availableAdsResolutions[i];
            if (candidate.width <= containerWidth && candidate.width > adsResolution.width) {
              adsResolution = candidate;
            }
          }

          let container = element;
          if (shouldUseDivWrapper) {
            const parent = element.parentElement ?? document.body;
            container = document.createElement('div');
            overrideElementStyles(container, divWrapperStyle);

            parent.replaceChild(container, element);
          }
          container.setAttribute('slise-ad-container', 'true');

          mountSliseAd(container, adsResolution.width, adsResolution.height, shouldUseDivWrapper);

          let currentParentDepth = 0;
          let currentParent: HTMLElement | null = shouldUseDivWrapper ? container : element;
          stylesOverrides.forEach(({ parentDepth, style }) => {
            while (parentDepth > currentParentDepth && currentParent) {
              currentParent = currentParent.parentElement;
              currentParentDepth++;
            }
            if (currentParent) {
              overrideElementStyles(currentParent, style);
            }
          });
        }
      )
    );
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
