import browser from 'webextension-polyfill';

import { getMisesInstallEnabledAds } from 'app/storage/mises-browser';
import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import {
  ContentScriptType,
  ADS_RULES_UPDATE_INTERVAL,
  WEBSITES_ANALYTICS_ENABLED,
  ADS_VIEWER_ADDRESS_STORAGE_KEY
} from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

import { getRulesFromContentScript, clearRulesCache } from './content-scripts/replace-ads';

let processing = false;

const replaceAds = async () => {
  if (processing) return;
  processing = true;

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

  processing = false;
};

// Prevents the script from running in an Iframe
if (window.frameElement === null) {
  checkIfShouldReplaceAds()
    .then(async shouldReplace => {
      if (!shouldReplace) return;

      await configureAds();
      // Replace ads with ours
      setInterval(() => replaceAds(), 1000);
    })
    .catch(console.error);
}

async function checkIfShouldReplaceAds() {
  const accountPkhFromStorage = await fetchFromStorage<string>(ADS_VIEWER_ADDRESS_STORAGE_KEY);

  if (accountPkhFromStorage) return await fetchFromStorage<boolean>(WEBSITES_ANALYTICS_ENABLED);

  return await getMisesInstallEnabledAds();
}
