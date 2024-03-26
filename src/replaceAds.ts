import browser from 'webextension-polyfill';

import { buildSwapPageUrlQuery } from 'app/pages/Swap/utils/build-url-query';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { ContentScriptType, ADS_RULES_UPDATE_INTERVAL, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';

import { getRulesFromContentScript, clearRulesCache } from './content-scripts/replace-ads';

let processing = false;

const tkeyInpageAdUrl = browser.runtime.getURL(`/misc/ad-banners/tkey-inpage-ad.png`);

const swapTkeyUrl = `${browser.runtime.getURL('fullpage.html')}#/swap?${buildSwapPageUrlQuery(
  'tez',
  'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0',
  true
)}`;

const replaceAds = async () => {
  if (processing) return;
  processing = true;

  try {
    const { getAdsActions, executeAdsActions } = await importExtensionAdsModule();
    const adsRules = await getRulesFromContentScript(window.parent.location);

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
  fetchFromStorage<boolean>(WEBSITES_ANALYTICS_ENABLED)
    .then(async enabled => {
      if (!enabled) return;

      const { configureAds } = await importExtensionAdsModule();
      configureAds({
        hypelabAdsWindowUrl: EnvVars.HYPELAB_ADS_WINDOW_URL,
        hypelab: {
          regular: EnvVars.HYPELAB_HIGH_PLACEMENT_SLUG,
          native: EnvVars.HYPELAB_NATIVE_PLACEMENT_SLUG,
          small: EnvVars.HYPELAB_SMALL_PLACEMENT_SLUG,
          wide: EnvVars.HYPELAB_WIDE_PLACEMENT_SLUG
        },
        swapTkeyUrl,
        tkeyInpageAdUrl,
        externalAdsActivityMessageType: ContentScriptType.ExternalAdsActivity
      });
      // Replace ads with ours
      window.addEventListener('load', () => replaceAds());
      window.addEventListener('ready', () => replaceAds());
      setInterval(() => replaceAds(), 1000);
      replaceAds();
    })
    .catch(console.error);
}
