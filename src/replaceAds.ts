import browser from 'webextension-polyfill';

import { checkIfShouldReplaceAds, throttleAsyncCalls } from 'content-scripts/utils';
import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { ContentScriptType, ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';

import { getRulesFromContentScript, clearRulesCache } from './content-scripts/replace-ads';

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
