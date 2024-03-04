import retry from 'async-retry';
import { debounce } from 'lodash';
import browser from 'webextension-polyfill';

import {
  getAdPlacesRulesForAllDomains,
  getProvidersRulesForAllDomains,
  getSelectorsForAllProviders,
  getPermanentAdPlacesRulesForAllDomains,
  getProvidersToReplaceAtAllSites,
  getPermanentNativeAdPlacesRulesForAllDomains
} from 'lib/apis/temple';
import { ALL_ADS_RULES_STORAGE_KEY } from 'lib/constants';

let inProgress = false;
export const updateRulesStorage = debounce(async () => {
  try {
    if (inProgress) return;

    inProgress = true;
    const rules = await retry(
      async () => {
        const [
          adPlacesRulesForAllDomains,
          providersRulesForAllDomains,
          providersSelectors,
          providersToReplaceAtAllSites,
          permanentAdPlacesRulesForAllDomains,
          permanentNativeAdPlacesRulesForAllDomains
        ] = await Promise.all([
          getAdPlacesRulesForAllDomains(),
          getProvidersRulesForAllDomains(),
          getSelectorsForAllProviders(),
          getProvidersToReplaceAtAllSites(),
          getPermanentAdPlacesRulesForAllDomains(),
          getPermanentNativeAdPlacesRulesForAllDomains()
        ]);

        return {
          adPlacesRulesForAllDomains,
          providersRulesForAllDomains,
          providersSelectors,
          providersToReplaceAtAllSites,
          permanentAdPlacesRulesForAllDomains,
          permanentNativeAdPlacesRulesForAllDomains,
          timestamp: Date.now()
        };
      },
      { maxTimeout: 20000, minTimeout: 1000 }
    );
    await browser.storage.local.set({ [ALL_ADS_RULES_STORAGE_KEY]: rules });
  } catch (e) {
    console.error(e);
  } finally {
    inProgress = false;
  }
}, 50);
