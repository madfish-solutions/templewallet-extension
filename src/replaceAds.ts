import browser from 'webextension-polyfill';

import { adRectIsSeen } from 'lib/ads/ad-rect-is-seen';
import { getAdsActions } from 'lib/ads/get-ads-actions';
import { AdActionType } from 'lib/ads/get-ads-actions/types';
import { clearRulesCache, getRulesFromContentScript } from 'lib/ads/get-rules-content-script';
import { getSlotId } from 'lib/ads/get-slot-id';
import { makeHypelabAdElement } from 'lib/ads/make-hypelab-ad';
import { makeSliseAdElement, registerSliseAd } from 'lib/ads/make-slise-ad';
import {
  ContentScriptType,
  ADS_RULES_UPDATE_INTERVAL,
  WEBSITES_ANALYTICS_ENABLED,
  TEMPLE_WALLET_AD_ATTRIBUTE_NAME,
  SLISE_AD_PLACEMENT_SLUG,
  AD_SEEN_THRESHOLD
} from 'lib/constants';

let oldHref = '';

let processing = false;

const loadingAdsIds = new Set();
const loadedAdsIds = new Set();

const sendExternalAdsActivityIfNecessary = () => {
  const newHref = window.parent.location.href;

  if (oldHref === newHref) {
    return;
  }

  oldHref = newHref;

  browser.runtime.sendMessage({ type: ContentScriptType.ExternalAdsActivity, url: newHref }).catch(console.error);
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
        sendExternalAdsActivityIfNecessary();
      } else {
        loadedAdIntersectionObserver.observe(element);
      }
    }
  });
};

const loadedAdIntersectionObserver = new IntersectionObserver(
  entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      sendExternalAdsActivityIfNecessary();
    }
  },
  { threshold: AD_SEEN_THRESHOLD }
);

const sliseAdMutationObserver = new MutationObserver(mutations => {
  mutations.forEach(({ target }) => {
    if (!(target instanceof HTMLModElement) || !target.getAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME)) {
      console.warn('Unexpected mutation target', target);

      return;
    }

    const iframeElement = target.querySelector('iframe');

    if (!iframeElement) {
      console.warn('No iframe in the ad', target);

      return;
    }

    const adId = target.id;
    subscribeToIframeLoadIfNecessary(adId, iframeElement);
  });
});

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
    console.log('oy vey 1', adsActions);

    await Promise.all(
      adsActions.map(async action => {
        if (action.type === AdActionType.RemoveElement) {
          action.element.remove();
        } else if (action.type === AdActionType.HideElement) {
          action.element.style.setProperty('display', 'none');
        } else {
          const {
            adResolution,
            shouldUseDivWrapper,
            divWrapperStyle = {},
            elementStyle = {},
            stylesOverrides = []
          } = action;
          stylesOverrides.sort((a, b) => a.parentDepth - b.parentDepth);
          let stylesOverridesCurrentElement: HTMLElement | null;
          let adElementWithWrapper: HTMLElement;
          const slotId = getSlotId();
          const shouldUseSliseAd = adResolution.placementType === SLISE_AD_PLACEMENT_SLUG;
          const adElement = shouldUseSliseAd
            ? makeSliseAdElement(slotId, adResolution.width, adResolution.height, elementStyle)
            : makeHypelabAdElement(adResolution, elementStyle);
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
          if (shouldUseSliseAd) {
            sliseAdMutationObserver.observe(adElement, { childList: true });
            registerSliseAd(slotId);
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
      })
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
      // Replace ads with ours
      window.addEventListener('load', () => replaceAds());
      window.addEventListener('ready', () => replaceAds());
      setInterval(() => replaceAds(), 1000);
      replaceAds();
    }
  });
}
