import browser from 'webextension-polyfill';

import {
  checkIfShouldReplaceAiChatAds,
  checkIfShouldReplaceInBrowserAds,
  runWhenDocumentIsActive
} from 'content-scripts/utils';
import { CHATGPT_DOMAIN } from 'lib/ads-constants/ads-constants';
import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import {
  ContentScriptType,
  ADS_RULES_UPDATE_INTERVAL,
  ADS_DISABLING_TIMESTAMPS_STORAGE_KEY,
  AI_CHATBOT_ADS_ENABLED,
  AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY,
  ADS_VIEWER_DATA_STORAGE_KEY,
  ALL_ADS_RULES_STORAGE_KEY,
  WEBSITES_ADS_ENABLED
} from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage, putToStorage } from 'lib/storage';

import { getRulesFromContentScript, clearRulesCache } from './content-scripts/replace-ads';
import {
  AdsScanRequest,
  AdsScanScheduler,
  createAdsScanScheduler,
  getPublisherMutationRoots,
  publisherMutationDelay
} from './content-scripts/replace-ads/scan-scheduler';

const INJECTED_PIXEL_ID = 'twa-injected-pixel';
const INJECTED_PIXEL_STYLE =
  'width: 1px; height: 1px; position: absolute; top: 0; right: 1px; background-color: transparent;';
let impressionWasPosted = false;

const startPixelTag = () =>
  setInterval(async () => {
    if (
      document.getElementById(INJECTED_PIXEL_ID) ||
      (!IS_MISES_BROWSER && !(await checkIfShouldReplaceInBrowserAds()))
    ) {
      return;
    }

    const element = document.createElement('div');
    element.id = INJECTED_PIXEL_ID;
    element.setAttribute('twa', 'true');
    element.style.cssText = INJECTED_PIXEL_STYLE;

    if (!document?.body) return;

    document.body.appendChild(element);
    if (!impressionWasPosted) {
      impressionWasPosted = true;
      browser.runtime
        .sendMessage({
          type: ContentScriptType.ExternalAdsActivity,
          url: window.location.href,
          provider: 'Pixel Tag'
        })
        .catch(e => console.error(e));
    }
  }, 1000);

let scheduler: AdsScanScheduler | undefined;
let documentObserver: MutationObserver | undefined;
let routeInterval: ReturnType<typeof setInterval> | undefined;
let websiteAdsEnabled = false;
let chatbotAdsEnabled = false;
let generation = 0;
let updateQueue = Promise.resolve();
let routeKey = window.location.href;
let observedRouteKey = routeKey;
let pageIsActive = true;
let activeAdsModule: Awaited<ReturnType<typeof importExtensionAdsModule>> | undefined;

const stopAdsActionTriggers = () => {
  scheduler?.dispose();
  scheduler = undefined;
  documentObserver?.disconnect();
  documentObserver = undefined;
  if (routeInterval) clearInterval(routeInterval);
  routeInterval = undefined;
};

const requestRouteScan = () => {
  if (window.location.href !== observedRouteKey) {
    observedRouteKey = window.location.href;
    activeAdsModule?.restoreWebsiteAds();
    clearRulesCache();
  }
  if (window.location.href !== routeKey) scheduler?.request(undefined, 0);
};

const updateAdsActionTriggers = () => {
  const currentGeneration = ++generation;
  stopAdsActionTriggers();
  websiteAdsEnabled = false;
  chatbotAdsEnabled = false;
  activeAdsModule?.restoreWebsiteAds();
  updateQueue = updateQueue
    .then(async () => {
      if (!pageIsActive || currentGeneration !== generation) return;
      const [inBrowserAdsEnabled, aiChatAdsEnabled, adsModule] = await Promise.all([
        checkIfShouldReplaceInBrowserAds(),
        checkIfShouldReplaceAiChatAds(),
        importExtensionAdsModule()
      ]);
      if (!pageIsActive || currentGeneration !== generation) return;
      activeAdsModule = adsModule;
      // Restore first so an older configuration cannot retain website placements.
      adsModule.restoreWebsiteAds();
      if (!inBrowserAdsEnabled && !aiChatAdsEnabled) return;
      await configureAds();
      if (!pageIsActive || currentGeneration !== generation) return;
      websiteAdsEnabled = inBrowserAdsEnabled;
      chatbotAdsEnabled = aiChatAdsEnabled;
      scheduler = createAdsScanScheduler(
        request => scanAds(request, currentGeneration),
        error => console.error('Replacing Ads error:', error)
      );
      if (inBrowserAdsEnabled) {
        adsModule.configureWebsiteAdsLifecycle(root => scheduler?.request(root));
      }
      documentObserver = new MutationObserver(mutations => {
        const roots = getPublisherMutationRoots(mutations);
        if (roots.length === 0) return;
        const delay = document.visibilityState === 'hidden' ? 700 : publisherMutationDelay(roots);
        for (const root of roots) scheduler?.request(root, delay);
      });
      documentObserver.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id', 'style', 'src', 'width', 'height', 'hidden']
      });
      // Content scripts use an isolated world; a history wrapper cannot observe page-world calls.
      routeInterval = setInterval(requestRouteScan, 1000);
    })
    .catch(error => console.error('Ads configuration error:', error));
};

const startAdsReplacement = () => {
  updateAdsActionTriggers();
  browser.storage.local.onChanged.addListener(changes => {
    if (
      WEBSITES_ADS_ENABLED in changes ||
      AI_CHATBOT_ADS_ENABLED in changes ||
      AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY in changes ||
      ADS_VIEWER_DATA_STORAGE_KEY in changes
    ) {
      updateAdsActionTriggers();
    } else if (ALL_ADS_RULES_STORAGE_KEY in changes) {
      clearRulesCache();
      scheduler?.request(undefined, 0);
    }
  });
  window.addEventListener('popstate', requestRouteScan);
  window.addEventListener('hashchange', requestRouteScan);
  document.addEventListener('yt-navigate-finish', requestRouteScan);
  window.addEventListener('pagehide', () => {
    pageIsActive = false;
    ++generation;
    stopAdsActionTriggers();
    websiteAdsEnabled = false;
    chatbotAdsEnabled = false;
    activeAdsModule?.restoreWebsiteAds();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    pageIsActive = true;
    updateAdsActionTriggers();
  });
};

const scanIsCurrent = (scanGeneration: number, href: string) =>
  pageIsActive &&
  generation === scanGeneration &&
  window.location.href === href &&
  document.visibilityState !== 'hidden';

const scanAds = async (request: AdsScanRequest, scanGeneration: number) => {
  const href = window.location.href;
  if (!scanIsCurrent(scanGeneration, href)) return;
  const adsModule = await importExtensionAdsModule();
  if (!scanIsCurrent(scanGeneration, href)) return;
  if (routeKey !== href) {
    routeKey = href;
    observedRouteKey = href;
    clearRulesCache();
    adsModule.restoreWebsiteAds();
    if (websiteAdsEnabled) adsModule.configureWebsiteAdsLifecycle(root => scheduler?.request(root));
    request = {};
  }
  if (websiteAdsEnabled) {
    adsModule.reconcileWebsiteAds();
    await replaceWebsiteAds(request, scanGeneration, href);
  }
  if (chatbotAdsEnabled && scanIsCurrent(scanGeneration, href)) {
    await insertAiChatbotAds(scanGeneration, href);
  }
};

let lastAttemptTs = 0;

const fetchAdsDisablingTimestamps = async () =>
  (await fetchFromStorage<StringRecord<number>>(ADS_DISABLING_TIMESTAMPS_STORAGE_KEY)) ?? {};
const shouldEnableChatbotAds = async (domain: string, timeout: number) => {
  const { [domain]: disabledAt = 0 } = await fetchAdsDisablingTimestamps();

  return (await checkIfShouldReplaceAiChatAds()) && disabledAt + timeout <= Date.now();
};
const disableAdsTemporarily = async (subkey: string) =>
  putToStorage(ADS_DISABLING_TIMESTAMPS_STORAGE_KEY, {
    ...(await fetchAdsDisablingTimestamps()),
    [subkey]: Date.now()
  });

const insertAiChatbotAds = async (scanGeneration: number, href: string) => {
  try {
    const { isChatgptChatPage, startChatgptChatAdsFlow } = await importExtensionAdsModule();
    let adsActionsResult: PromiseSettledResult<void>[] = [];

    if (
      isChatgptChatPage() &&
      (await shouldEnableChatbotAds(CHATGPT_DOMAIN, 24 * 3600 * 1000)) &&
      scanIsCurrent(scanGeneration, href)
    ) {
      adsActionsResult = await startChatgptChatAdsFlow(() => disableAdsTemporarily(CHATGPT_DOMAIN));
    }

    adsActionsResult.forEach(
      (result: PromiseSettledResult<void>) =>
        void (result.status === 'rejected' && console.error('Replacing an ad error:', result.reason))
    );
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }
};

const replaceWebsiteAds = async (request: AdsScanRequest, scanGeneration: number, href: string) => {
  try {
    const {
      getAdsActions,
      executeAdsActions,
      isYoutubeHomePage,
      startYoutubeHomeAdsFlow,
      isYoutubeSearchPage,
      isYoutubeWatchPage,
      isChatgptChatPage,
      startYoutubeSearchAdsFlow,
      startYoutubeWatchAdsFlow
    } = await importExtensionAdsModule();
    let adsActionsResult: PromiseSettledResult<void>[] = [];

    if (!scanIsCurrent(scanGeneration, href) || !websiteAdsEnabled || isChatgptChatPage()) {
      return;
    }

    if (isYoutubeHomePage()) {
      adsActionsResult = await startYoutubeHomeAdsFlow();
    } else if (isYoutubeSearchPage()) {
      adsActionsResult = await startYoutubeSearchAdsFlow();
    } else if (isYoutubeWatchPage()) {
      adsActionsResult = await startYoutubeWatchAdsFlow();
    } else {
      const adsRules = await getRulesFromContentScript(window.location);

      if (
        adsRules.timestamp < Date.now() - ADS_RULES_UPDATE_INTERVAL &&
        lastAttemptTs < Date.now() - ADS_RULES_UPDATE_INTERVAL
      ) {
        lastAttemptTs = Date.now();
        clearRulesCache();
        browser.runtime.sendMessage({ type: ContentScriptType.UpdateAdsRules }).catch(e => {
          console.error(e);
        });
      }

      if (!scanIsCurrent(scanGeneration, href)) return;
      const adsActions = await getAdsActions(adsRules, request);
      if (!scanIsCurrent(scanGeneration, href)) return;
      adsActionsResult = await executeAdsActions(adsActions);
    }
    adsActionsResult.forEach(
      (result: PromiseSettledResult<void>) =>
        void (result.status === 'rejected' && console.error('Replacing an ad error:', result.reason))
    );
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }
};

runWhenDocumentIsActive(() => {
  startPixelTag();
  startAdsReplacement();
});
