import browser from 'webextension-polyfill';

import { AdsResolution, HYPELAB_ADS_RESOLUTIONS } from 'lib/ads/ads-resolutions';
import { getAdsContainers } from 'lib/ads/get-ads-containers';
import { mountHypelabAd } from 'lib/ads/mount-hypelab-ad';
import { ContentScriptType, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { TempleMessageType, TempleResponse } from 'lib/temple/types';

import { getIntercom } from './intercom-client';

let oldHref = '';

let processing = false;

const getSliseAdsData = async (location: Location) => {
  const { hostname, href } = location;

  const res: TempleResponse | nullish = await getIntercom().request({
    type: TempleMessageType.ExternalAdsDataRequest,
    hostname,
    href
  });

  if (res?.type === TempleMessageType.ExternalAdsDataResponse) return res.data;

  throw new Error('Unmatched Intercom response');
};

const resolutionMatchesContainer = (resolution: AdsResolution, containerWidth: number, containerHeight: number) =>
  resolution.minContainerWidth <= containerWidth &&
  resolution.minContainerHeight <= containerHeight &&
  resolution.maxContainerWidth >= containerWidth &&
  resolution.maxContainerHeight >= containerHeight;

const sizeMatchesConstraints = (containerWidth: number, containerHeight: number) =>
  HYPELAB_ADS_RESOLUTIONS.some(resolution => resolutionMatchesContainer(resolution, containerWidth, containerHeight));

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

    await Promise.all(
      adsContainersToReplace.map(
        async ({
          element,
          width: containerWidth,
          height: containerHeight,
          shouldUseDivWrapper,
          divWrapperStyle = {},
          stylesOverrides = []
        }) => {
          stylesOverrides.sort((a, b) => a.parentDepth - b.parentDepth);
          let adsResolution = HYPELAB_ADS_RESOLUTIONS[0];
          for (let i = 1; i < HYPELAB_ADS_RESOLUTIONS.length; i++) {
            const candidate = HYPELAB_ADS_RESOLUTIONS[i];
            if (resolutionMatchesContainer(candidate, containerWidth, containerHeight)) {
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

          console.log('oy vey 3', container);
          mountHypelabAd(container, adsResolution, shouldUseDivWrapper);

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
