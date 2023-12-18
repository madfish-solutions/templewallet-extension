import retry from 'async-retry';
import memoize from 'p-memoize';
import browser from 'webextension-polyfill';

import {
  getAdPlacesRulesByDomain,
  getProvidersRulesByDomain,
  getProvidersToReplaceAtAllSites,
  getSelectorsForAllProviders,
  SliseAdPlacesRule
} from 'lib/apis/temple';
import { ContentScriptType, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { getAdsContainers } from 'lib/slise/get-ads-containers';

const availableAdsResolutions = [
  { width: 270, height: 90 },
  { width: 728, height: 90 }
];

let oldHref = '';

let processing = false;

const withInfiniteRetry = <T>(fn: () => Promise<T>) =>
  retry(fn, { forever: true, minTimeout: 1000, maxTimeout: 60000 });

const getSliseAdsData = memoize(
  async (location: Location) => {
    const { hostname, href } = location;
    const [adPlacesRules, providersRules, providersToReplaceAtAllSites, selectorsForAllProviders] = await Promise.all([
      withInfiniteRetry(() => getAdPlacesRulesByDomain(hostname)),
      withInfiniteRetry(() => getProvidersRulesByDomain(hostname)),
      withInfiniteRetry(() => getProvidersToReplaceAtAllSites()),
      withInfiniteRetry(() => getSelectorsForAllProviders())
    ]);

    const aggregatedRelatedAdPlacesRules = adPlacesRules.reduce<Array<SliseAdPlacesRule['selector']>>(
      (acc, { urlRegexes, selector }) => {
        if (!urlRegexes.some(regex => regex.test(href))) return acc;

        const { cssString, shouldUseDivWrapper, parentDepth, isMultiple, divWrapperStyle } = selector;
        const selectorToComplementIndex = acc.findIndex(
          candidate =>
            candidate.isMultiple === isMultiple &&
            candidate.shouldUseDivWrapper === shouldUseDivWrapper &&
            candidate.parentDepth === parentDepth &&
            JSON.stringify(candidate.divWrapperStyle) === JSON.stringify(divWrapperStyle)
        );
        if (selectorToComplementIndex === -1) {
          acc.push(selector);
        } else {
          acc[selectorToComplementIndex].cssString += ', '.concat(cssString);
        }

        return acc;
      },
      []
    );

    const relatedProvidersRules = providersRules.filter(({ urlRegexes }) => urlRegexes.some(regex => regex.test(href)));
    const alreadyProcessedProviders = new Set<string>();
    const selectorsForProvidersToReplace = new Set<string>();
    const handleProvider = (provider: string) => {
      if (alreadyProcessedProviders.has(provider)) return;

      const newSelectors = selectorsForAllProviders[provider] ?? [];
      newSelectors.forEach(selector => selectorsForProvidersToReplace.add(selector));
      alreadyProcessedProviders.add(provider);
    };

    providersToReplaceAtAllSites.forEach(handleProvider);
    relatedProvidersRules.forEach(({ providers }) => providers.forEach(handleProvider));

    let providersSelector = '';
    selectorsForProvidersToReplace.forEach(selector => {
      providersSelector += selector + ', ';
    });
    if (providersSelector) {
      providersSelector = providersSelector.slice(0, -2);
    }

    return {
      adPlacesRules: aggregatedRelatedAdPlacesRules,
      providersSelector
    };
  },
  { cacheKey: ([{ hostname, href }]) => `${hostname} ${href}`, maxAge: 3600 * 1000 }
);

const makeAdRoot = memoize(async (container: HTMLElement) => {
  const ReactDomModule = await import('react-dom/client');

  return ReactDomModule.createRoot(container);
});

const sizeMatchesConstraints = (width: number, height: number) =>
  ((width >= 600 && width <= 900) || (width >= 180 && width <= 430)) && height >= 60 && height <= 120;

const containerIsRenderedProperly = (width: number, height: number) => width > 1 || height > 1;

const replaceAds = async () => {
  if (processing) return;
  processing = true;

  const sliseAdsData = await getSliseAdsData(window.parent.location);

  try {
    const adsContainers = getAdsContainers(sliseAdsData);
    const adsContainersToReplace = adsContainers.filter(
      ({ width, height, shouldNeglectSizeConstraints }) =>
        (shouldNeglectSizeConstraints && containerIsRenderedProperly(width, height)) ||
        sizeMatchesConstraints(width, height)
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

    const SliceAdModule = await import('lib/slise/slise-ad');

    await Promise.all(
      adsContainersToReplace.map(
        async ({ element, width: containerWidth, shouldUseDivWrapper, divWrapperStyle = {} }) => {
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
            container.setAttribute('slise-ad-container', 'true');
            for (const stylePropName in divWrapperStyle) {
              container.style.setProperty(stylePropName, divWrapperStyle[stylePropName]);
            }

            parent.replaceChild(container, element);
          }

          const adRoot = await makeAdRoot(container);
          adRoot.render(SliceAdModule.buildSliceAdReactNode(adsResolution.width, adsResolution.height));
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
