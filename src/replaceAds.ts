import browser from 'webextension-polyfill';

import { checkIfShouldReplaceAds, throttleAsyncCalls } from 'content-scripts/utils';
import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { ContentScriptType, ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';

import { getRulesFromContentScript, clearRulesCache } from './content-scripts/replace-ads';

const INJECTED_PIXEL_ID = 'twa-injected-pixel';
let impressionWasPosted = false;

setInterval(async () => {
  if (document.getElementById(INJECTED_PIXEL_ID) || (!IS_MISES_BROWSER && !(await checkIfShouldReplaceAds()))) {
    return;
  }

  const element = document.createElement('div');
  element.id = INJECTED_PIXEL_ID;
  element.setAttribute('twa', 'true');
  element.style.width = '1px';
  element.style.height = '1px';
  element.style.position = 'absolute';
  element.style.top = '0px';
  element.style.right = '1px';
  element.style.backgroundColor = 'transparent';
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

checkIfShouldReplaceAds().then(async shouldReplace => {
  if (!shouldReplace) return;

  await configureAds();

  // Replace ads with ours
  setInterval(() => replaceAds(), 1000);
});

const replaceAds = throttleAsyncCalls(async () => {
  try {
    const { getAdsActions, executeAdsActions } = await importExtensionAdsModule();
    const adsRules = await getRulesFromContentScript(window.location);

    if (adsRules.timestamp < Date.now() - ADS_RULES_UPDATE_INTERVAL) {
      clearRulesCache();
      browser.runtime.sendMessage({ type: ContentScriptType.UpdateAdsRules }).catch(e => console.error(e));
    }

    const adsActions = await getAdsActions(adsRules);

    const adsActionsResult = await executeAdsActions(adsActions);
    adsActionsResult.forEach(
      (result: PromiseSettledResult<void>) =>
        void (result.status === 'rejected' && console.error('Replacing an ad error:', result.reason))
    );
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }
});
