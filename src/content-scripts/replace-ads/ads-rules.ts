import memoizee from 'memoizee';

import { ALL_ADS_RULES_STORAGE_KEY, ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

export const getRulesFromContentScript = memoizee(
  async (location: Location) => {
    try {
      // An error appears below if and only if optional dependencies are not installed
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      // eslint-disable-next-line import/no-unresolved
      const { transformRawRules } = await import('@temple-wallet/extension-ads');
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
