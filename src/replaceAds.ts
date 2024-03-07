import browser from 'webextension-polyfill';

import { AdsProviderTitle } from 'lib/ads';
import { adRectIsSeen } from 'lib/ads/ad-rect-is-seen';
import { makeTKeyAdView, makeHypelabAdView, makePersonaAdView } from 'lib/ads/ad-viewes';
import type { AdMetadata, AdSource } from 'lib/ads/ads-meta';
import { getAdsActions, AdActionType } from 'lib/ads/get-ads-actions';
import { InsertAdAction } from 'lib/ads/get-ads-actions/types';
import { clearRulesCache, getRulesFromContentScript } from 'lib/ads/get-rules-content-script';
import {
  ContentScriptType,
  ADS_RULES_UPDATE_INTERVAL,
  WEBSITES_ANALYTICS_ENABLED,
  TEMPLE_WALLET_AD_ATTRIBUTE_NAME,
  AD_SEEN_THRESHOLD
} from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

let processing = false;

let adSource: AdSource;

const loadingAdsIds = new Set();
const loadedAdsIds = new Set();
const alreadySentAnalyticsAdsIds = new Set();

const sendExternalAdsActivity = (adId: string) => {
  if (alreadySentAnalyticsAdsIds.has(adId)) {
    return;
  }

  alreadySentAnalyticsAdsIds.add(adId);

  const url = window.parent.location.href;

  browser.runtime
    .sendMessage({
      type: ContentScriptType.ExternalAdsActivity,
      url,
      provider: AdsProviderTitle[adSource.providerName]
    })
    .catch(err => void console.error(err));
};

const subscribeToIframeLoadIfNecessary = (adId: string, element: HTMLIFrameElement) => {
  if (loadingAdsIds.has(adId)) {
    return;
  }

  loadingAdsIds.add(adId);

  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      reject(new Error('Timeout exceeded'));
    }, 30000);

    const messageListener = (e: MessageEvent<any>) => {
      if (e.source !== element.contentWindow) return;

      try {
        const data = JSON.parse(e.data);

        if (data.id !== adId) return;

        if (data.type === 'ready') {
          window.removeEventListener('message', messageListener);
          resolve();
        } else if (data.type === 'error') {
          window.removeEventListener('message', messageListener);
          reject(new Error(data.reason ?? 'Unknown error'));
        }
      } catch {}
    };

    element.addEventListener('load', () => void window.addEventListener('message', messageListener));
  })
    .then(() => {
      if (loadedAdsIds.has(adId)) return;

      loadedAdsIds.add(adId);
      const adIsSeen = adRectIsSeen(element);

      if (adIsSeen) {
        sendExternalAdsActivity(adId);
      } else {
        loadedAdIntersectionObserver.observe(element);
      }
    })
    .finally(() => void loadingAdsIds.delete(adId));
};

const loadedAdIntersectionObserver = new IntersectionObserver(
  entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      const elem = entries[0].target;

      sendExternalAdsActivity(elem.id);
    }
  },
  { threshold: AD_SEEN_THRESHOLD }
);

const overrideElementStyles = (element: HTMLElement, overrides: StringRecord) => {
  for (const stylePropName in overrides) {
    element.style.setProperty(stylePropName, overrides[stylePropName]);
  }
};

const replaceAds = async () => {
  if (processing) return;
  processing = true;

  try {
    const adsRules = await getRulesFromContentScript(window.parent.location);

    if (adsRules.timestamp < Date.now() - ADS_RULES_UPDATE_INTERVAL) {
      clearRulesCache();
      browser.runtime.sendMessage({ type: ContentScriptType.UpdateAdsRules }).catch(e => console.error(e));
    }

    const adsActions = await getAdsActions(adsRules);

    for (const action of adsActions) {
      if (action.type === AdActionType.RemoveElement) {
        action.element.remove();
      } else if (action.type === AdActionType.HideElement) {
        action.element.style.setProperty('display', 'none');
      } else {
        processInsertAdAction(action, action.meta);
      }
    }
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }

  processing = false;
};

const processInsertAdAction = (action: InsertAdAction, ad: AdMetadata) => {
  const { shouldUseDivWrapper, divWrapperStyle = {} } = action;

  const wrapperElement = document.createElement('div');
  wrapperElement.setAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME, 'true');

  if (shouldUseDivWrapper) {
    overrideElementStyles(wrapperElement, divWrapperStyle);
  } else {
    wrapperElement.style.display = 'contents';
  }

  processInsertAdActionOnce(action, ad, wrapperElement).catch(error => {
    console.error('Replacing an ad error:', error);
    wrapperElement.remove();

    const nextAd = action.fallbacks.shift();
    if (nextAd) processInsertAdAction(action, nextAd);
  });
};

const processInsertAdActionOnce = async (action: InsertAdAction, ad: AdMetadata, wrapperElement: HTMLDivElement) => {
  const { source, dimensions } = ad;

  const { elementStyle = {}, stylesOverrides = [] } = action;

  stylesOverrides.sort((a, b) => a.parentDepth - b.parentDepth);

  let stylesOverridesCurrentElement: HTMLElement | null;

  const { providerName } = source;

  const { element: adElement, postAppend } =
    providerName === 'Temple'
      ? makeTKeyAdView(dimensions.width, dimensions.height, elementStyle)
      : providerName === 'HypeLab'
      ? makeHypelabAdView(source, dimensions, elementStyle)
      : await makePersonaAdView(source.shape, dimensions, elementStyle);

  wrapperElement.appendChild(adElement);

  switch (action.type) {
    case AdActionType.ReplaceAllChildren:
      stylesOverridesCurrentElement = action.parent;
      action.parent.innerHTML = '';
      action.parent.appendChild(wrapperElement);
      break;
    case AdActionType.ReplaceElement:
      stylesOverridesCurrentElement = action.element.parentElement;
      action.element.replaceWith(wrapperElement);
      break;
    default:
      stylesOverridesCurrentElement = action.parent;
      action.parent.insertBefore(wrapperElement, action.parent.children[action.insertionIndex]);
      break;
  }

  if (postAppend) await postAppend();

  adSource = source;

  if (adElement instanceof HTMLIFrameElement) {
    await subscribeToIframeLoadIfNecessary(adElement.id, adElement);
  } else {
    loadedAdIntersectionObserver.observe(adElement);
  }

  let currentParentDepth = 0;
  stylesOverrides.forEach(({ parentDepth, style }) => {
    while (parentDepth > currentParentDepth && stylesOverridesCurrentElement) {
      stylesOverridesCurrentElement = stylesOverridesCurrentElement.parentElement;
      currentParentDepth++;
    }
    if (stylesOverridesCurrentElement) {
      overrideElementStyles(stylesOverridesCurrentElement, style);
    }
  });
};

// Prevents the script from running in an Iframe
if (window.frameElement === null) {
  fetchFromStorage<boolean>(WEBSITES_ANALYTICS_ENABLED).then(enabled => {
    if (enabled) {
      // Replace ads with ours
      window.addEventListener('load', () => replaceAds());
      window.addEventListener('ready', () => replaceAds());
      setInterval(() => replaceAds(), 1000);
      replaceAds();
    }
  });
}
