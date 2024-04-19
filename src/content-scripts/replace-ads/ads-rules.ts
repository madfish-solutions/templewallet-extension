import memoizee from 'memoizee';

import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { ALL_ADS_RULES_STORAGE_KEY, ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

export const getRulesFromContentScript = memoizee(
  async (location: Location) => {
    try {
      const { transformRawRules } = await importExtensionAdsModule();
      const rulesStored = await fetchFromStorage(ALL_ADS_RULES_STORAGE_KEY);

      if (!rulesStored) throw new Error('No rules for ads found');

      return transformRawRules(location, rulesStored);
    } catch (error) {
      console.error(error);

      return {
        adPlacesRules: [],
        permanentAdPlacesRules: [],
        providersSelector: '',
        timestamp: 0
      };
    }
  },
  { maxAge: ADS_RULES_UPDATE_INTERVAL, normalizer: ([location]) => location.href, promise: true }
);

export const clearRulesCache = () => getRulesFromContentScript.clear();
