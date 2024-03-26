import retry from 'async-retry';
import { debounce } from 'lodash';

import {
  getAdPlacesRulesForAllDomains,
  getProvidersRulesForAllDomains,
  getSelectorsForAllProviders,
  getPermanentAdPlacesRulesForAllDomains,
  getProvidersToReplaceAtAllSites,
  getPermanentNativeAdPlacesRulesForAllDomains
} from 'lib/apis/temple';
import { ALL_ADS_RULES_STORAGE_KEY } from 'lib/constants';
import { putToStorage } from 'lib/storage';

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
    await putToStorage(ALL_ADS_RULES_STORAGE_KEY, rules);
  } catch (e) {
    console.error(e);
  } finally {
    inProgress = false;
  }
}, 50);
