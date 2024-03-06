import browser from 'webextension-polyfill';

import { adRectIsSeen } from 'lib/ads/ad-rect-is-seen';
import { getAdsActions } from 'lib/ads/get-ads-actions';
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
  TKEY_AD_PLACEMENT_SLUG,
  AD_SEEN_THRESHOLD
} from 'lib/constants';
import { delay } from 'lib/utils';

let processing = false;

let provider: string;

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
    .sendMessage({ type: ContentScriptType.ExternalAdsActivity, url, provider })
    .catch(err => void console.error(err));
};

const subscribeToIframeLoadIfNecessary = (adId: string, element: HTMLIFrameElement) => {
  if (loadingAdsIds.has(adId)) {
    return;
  }

  loadingAdsIds.add(adId);
  element.addEventListener('load', async () => {
    Promise.race([
      new Promise<void>((res, rej) => {
        const messageListener = (e: MessageEvent<any>) => {
          if (e.source !== element.contentWindow) return;

          try {
            const data = JSON.parse(e.data);

            if (data.id !== adId) return;

            if (data.type === 'ready') {
              window.removeEventListener('message', messageListener);
              res();
            } else if (data.type === 'error') {
              window.removeEventListener('message', messageListener);
              rej(new Error(data.reason ?? 'Unknown error'));
            }
          } catch {}
        };
        window.addEventListener('message', messageListener);
      }),
      delay(30000).then(() => {
        throw new Error('Timeout exceeded');
      })
    ])
      .then(() => {
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
      })
      .catch(e => {
        console.error(`Failed to load ad ${adId}`, e);
        loadingAdsIds.delete(adId);
      });
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
          const shouldUseTKeyAd = adResolution.placementType === TKEY_AD_PLACEMENT_SLUG;
          const adElement = shouldUseTKeyAd
            ? makeTKeyAdElement(slotId, adResolution.width, adResolution.height, elementStyle)
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
          if (shouldUseTKeyAd) {
            provider = 'Temple Wallet';
            loadedAdIntersectionObserver.observe(adElement);
          } else {
            provider = 'HypeLab';
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
