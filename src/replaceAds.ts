import browser from 'webextension-polyfill';

import {
  ContentScriptType,
  ADS_RULES_UPDATE_INTERVAL,
  WEBSITES_ANALYTICS_ENABLED,
  TEMPLE_WALLET_AD_ATTRIBUTE_NAME
} from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

import {
  getRulesFromContentScript,
  clearRulesCache,
  getAdsActions,
  AdActionType,
  InsertAdAction,
  AdMetadata,
  overrideElementStyles,
  observeIntersection,
  subscribeToIframeLoadIfNecessary,
  makeTKeyAdView,
  makeHypelabAdView,
  makePersonaAdView
} from './content-scripts/replace-ads';

let processing = false;

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

    await Promise.allSettled(
      adsActions.map(async action => {
        if (action.type === AdActionType.RemoveElement) {
          action.element.remove();
        } else if (action.type === AdActionType.HideElement) {
          action.element.style.setProperty('display', 'none');
        } else {
          await processInsertAdAction(action, action.meta);
        }
      })
    );
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }

  processing = false;
};

const processInsertAdAction = async (action: InsertAdAction, ad: AdMetadata) => {
  const { shouldUseDivWrapper, divWrapperStyle = {} } = action;

  const wrapperElement = document.createElement('div');
  wrapperElement.setAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME, 'true');

  if (shouldUseDivWrapper) {
    overrideElementStyles(wrapperElement, divWrapperStyle);
  } else {
    wrapperElement.style.display = 'contents';
  }

  await processInsertAdActionOnce(action, ad, wrapperElement).catch(error => {
    console.error('Replacing an ad error:', error);

    const nextAd = action.fallbacks.shift();
    if (nextAd) {
      // Changing element to replace
      if (action.type === AdActionType.ReplaceElement) action.element = wrapperElement;

      return processInsertAdAction(action, nextAd);
    } else wrapperElement.remove();
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
      : makePersonaAdView(source.shape, dimensions, elementStyle);

  adElement.setAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME, 'true');
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

  if (adElement instanceof HTMLIFrameElement) {
    await subscribeToIframeLoadIfNecessary(adElement.id, source.providerName, adElement);
  } else {
    observeIntersection(adElement, source.providerName);
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
