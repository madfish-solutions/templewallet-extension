import { RawAllAdsRules, transformRawRules } from '@temple-wallet/extension-ads';
import memoizee from 'memoizee';

import { ALL_ADS_RULES_STORAGE_KEY, ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

export const getRulesFromContentScript = memoizee(
  async (location: Location) => {
    try {
      const rulesStored = await fetchFromStorage<RawAllAdsRules>(ALL_ADS_RULES_STORAGE_KEY);

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
