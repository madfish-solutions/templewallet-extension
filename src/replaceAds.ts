import browser from 'webextension-polyfill';

import { AdsProviderTitle } from 'lib/ads';
import { adRectIsSeen } from 'lib/ads/ad-rect-is-seen';
import { getAdsActions } from 'lib/ads/get-ads-actions';
import { AdSource } from 'lib/ads/get-ads-actions/helpers';
import { AdActionType } from 'lib/ads/get-ads-actions/types';
import { clearRulesCache, getRulesFromContentScript } from 'lib/ads/get-rules-content-script';
import { getSlotId } from 'lib/ads/get-slot-id';
import { makeHypelabAdElement } from 'lib/ads/make-hypelab-ad';
import { makeTKeyAdElement } from 'lib/ads/make-tkey-ad';
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
  element.addEventListener('load', () => {
    loadingAdsIds.delete(adId);
    if (!loadedAdsIds.has(adId)) {
      loadedAdsIds.add(adId);
      const adIsSeen = adRectIsSeen(element);

      if (adIsSeen) {
        sendExternalAdsActivity(adId);
      } else {
        loadedAdIntersectionObserver.observe(element);
      }
    }
  });
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

const overrideElementStyles = (element: HTMLElement, overrides: Record<string, string>) => {
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
        const {
          source,
          dimensions,
          shouldUseDivWrapper,
          divWrapperStyle = {},
          elementStyle = {},
          stylesOverrides = []
        } = action;

        stylesOverrides.sort((a, b) => a.parentDepth - b.parentDepth);

        let stylesOverridesCurrentElement: HTMLElement | null;
        let adElementWithWrapper: HTMLElement;

        const slotId = getSlotId();
        const isTempleKeyAd = source.providerName === 'Temple';

        const adElement = isTempleKeyAd
          ? makeTKeyAdElement(slotId, dimensions.width, dimensions.height, elementStyle)
          : makeHypelabAdElement(source, dimensions, elementStyle);

        if (shouldUseDivWrapper) {
          adElementWithWrapper = document.createElement('div');
          adElementWithWrapper.setAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME, 'true');
          overrideElementStyles(adElementWithWrapper, divWrapperStyle);
          adElementWithWrapper.appendChild(adElement);
        } else {
          adElementWithWrapper = adElement;
        }

        switch (action.type) {
          case AdActionType.ReplaceAllChildren:
            stylesOverridesCurrentElement = action.parent;
            action.parent.innerHTML = '';
            action.parent.appendChild(adElementWithWrapper);
            break;
          case AdActionType.ReplaceElement:
            stylesOverridesCurrentElement = action.element.parentElement;
            action.element.replaceWith(adElementWithWrapper);
            break;
          default:
            stylesOverridesCurrentElement = action.parent;
            action.parent.insertBefore(adElementWithWrapper, action.parent.children[action.insertionIndex]);
            break;
        }

        adSource = source;
        if (isTempleKeyAd) {
          loadedAdIntersectionObserver.observe(adElement);
        } else {
          subscribeToIframeLoadIfNecessary(adElement.id, adElement as HTMLIFrameElement);
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
      }
    }
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }

  processing = false;
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
