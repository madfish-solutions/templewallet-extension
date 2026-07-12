import browser from 'webextension-polyfill';

import { checkIfShouldReplaceAds } from 'content-scripts/utils';
import { CHATGPT_DOMAIN } from 'lib/ads-constants/ads-constants';
import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import {
  ContentScriptType,
  ADS_RULES_UPDATE_INTERVAL,
  ADS_DISABLING_TIMESTAMPS_STORAGE_KEY,
  AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY,
  WEBSITES_ADS_ENABLED
} from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { throttleAsyncCalls } from 'lib/utils/functions';

import { getRulesFromContentScript, clearRulesCache } from './content-scripts/replace-ads';

const INJECTED_PIXEL_ID = 'twa-injected-pixel';
const INJECTED_PIXEL_STYLE =
  'width: 1px; height: 1px; position: absolute; top: 0; right: 1px; background-color: transparent;';
let impressionWasPosted = false;

setInterval(async () => {
  if (document.getElementById(INJECTED_PIXEL_ID) || (!IS_MISES_BROWSER && !(await checkIfShouldReplaceAds()))) {
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

let adsActionTriggers: { documentObserver: MutationObserver; interval: NodeJS.Timeout } | undefined;

const updateAdsActionTriggers = () =>
  checkIfShouldReplaceAds().then(async shouldReplace => {
    if (shouldReplace) {
      if (adsActionTriggers) return;

      await configureAds();

      // Replace ads with ours
      const interval = setInterval(() => replaceAdsByInterval(), 1000);
      const documentObserver = new MutationObserver(() => insertAiChatbotAds());
      documentObserver.observe(document, { childList: true, subtree: true });

      adsActionTriggers = { documentObserver, interval };

      return;
    }

    if (!adsActionTriggers) return;

    adsActionTriggers.documentObserver.disconnect();
    clearInterval(adsActionTriggers.interval);
    adsActionTriggers = undefined;
  });

updateAdsActionTriggers();
browser.storage.local.onChanged.addListener(changes => {
  if (WEBSITES_ADS_ENABLED in changes) {
    updateAdsActionTriggers();
  }
});

let lastAttemptTs = 0;

const fetchAdsDisablingTimestamps = async () =>
  (await fetchFromStorage<StringRecord<number>>(ADS_DISABLING_TIMESTAMPS_STORAGE_KEY)) ?? {};
const shouldDisableAds = async (domain: string, timeout: number) => {
  const { [domain]: timestamp = 0 } = await fetchAdsDisablingTimestamps();
  const enabledDomains = (await fetchFromStorage<string[]>(AI_CHATBOT_ADS_ENABLED_DOMAINS_STORAGE_KEY)) ?? [];

  return enabledDomains.includes(domain) && timestamp + timeout > Date.now();
};
const disableAdsTemporarily = async (subkey: string) =>
  putToStorage(ADS_DISABLING_TIMESTAMPS_STORAGE_KEY, {
    ...(await fetchAdsDisablingTimestamps()),
    [subkey]: Date.now()
  });

const insertAiChatbotAds = async () => {
  try {
    const { isChatgptChatPage, startChatgptChatAdsFlow } = await importExtensionAdsModule();
    let adsActionsResult: PromiseSettledResult<void>[] = [];

    if (isChatgptChatPage() && !(await shouldDisableAds(CHATGPT_DOMAIN, 24 * 3600 * 1000))) {
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

const replaceAdsByInterval = throttleAsyncCalls(async () => {
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

    if (isChatgptChatPage()) {
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

      const adsActions = await getAdsActions(adsRules);

      adsActionsResult = await executeAdsActions(adsActions);
    }
    adsActionsResult.forEach(
      (result: PromiseSettledResult<void>) =>
        void (result.status === 'rejected' && console.error('Replacing an ad error:', result.reason))
    );
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }
});
