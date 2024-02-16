import browser from 'webextension-polyfill';

import { ContentScriptType, SLISE_ADS_RULES_UPDATE_INTERVAL, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { getAdsActions } from 'lib/slise/get-ads-actions';
import { AdActionType } from 'lib/slise/get-ads-actions/types';
import { clearRulesCache, getRulesFromContentScript } from 'lib/slise/get-rules-content-script';
import { getSlotId } from 'lib/slise/get-slot-id';
import { makeSliseAdElement, registerAd } from 'lib/slise/make-slise-ad';

let oldHref = '';

let processing = false;

const overrideElementStyles = (element: HTMLElement, overrides: Record<string, string>) => {
  for (const stylePropName in overrides) {
    element.style.setProperty(stylePropName, overrides[stylePropName]);
  }
};

const replaceAds = async () => {
  if (processing) return;
  processing = true;

  try {
    const sliseAdsData = await getRulesFromContentScript(window.parent.location);

    if (sliseAdsData.timestamp < Date.now() - SLISE_ADS_RULES_UPDATE_INTERVAL) {
      clearRulesCache();
      browser.runtime.sendMessage({ type: ContentScriptType.UpdateSliseAdsRules }).catch(e => console.error(e));
    }

    const adsActions = await getAdsActions(sliseAdsData);

    const newHref = window.parent.location.href;
    if (
      oldHref !== newHref &&
      adsActions.some(({ type }) =>
        [AdActionType.ReplaceAllChildren, AdActionType.ReplaceElement, AdActionType.SimpleInsertAd].includes(type)
      )
    ) {
      oldHref = newHref;

      browser.runtime
        .sendMessage({
          type: ContentScriptType.ExternalAdsActivity,
          url: window.parent.location.origin
        })
        .catch(console.error);
    }

    await Promise.all(
      adsActions.map(async action => {
        if (action.type === AdActionType.RemoveElement) {
          action.element.remove();
        } else if (action.type === AdActionType.HideElement) {
          action.element.style.setProperty('display', 'none');
        } else {
          const slotId = getSlotId();
          const { adRect, shouldUseDivWrapper, divWrapperStyle = {}, stylesOverrides = [] } = action;
          stylesOverrides.sort((a, b) => a.parentDepth - b.parentDepth);
          let stylesOverridesCurrentElement: HTMLElement | null;
          let adElementWithWrapper: HTMLElement;
          if (shouldUseDivWrapper) {
            adElementWithWrapper = document.createElement('div');
            adElementWithWrapper.setAttribute('slise-ad-container', 'true');
            overrideElementStyles(adElementWithWrapper, divWrapperStyle);
            const adElement = makeSliseAdElement(slotId, adRect.width, adRect.height);
            adElementWithWrapper.appendChild(adElement);
          } else {
            adElementWithWrapper = makeSliseAdElement(slotId, adRect.width, adRect.height);
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
          let currentParentDepth = 0;
          registerAd(slotId);
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
      // Replace ads with those from Slise
      window.addEventListener('load', () => replaceAds());
      window.addEventListener('ready', () => replaceAds());
      setInterval(() => replaceAds(), 1000);
      replaceAds();
    }
  });
}
