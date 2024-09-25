import memoizee from 'memoizee';

import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { ALL_ADS_RULES_STORAGE_KEY, ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

export const getRulesFromStorage = memoizee(
  async (locationOrHref: Location | string) => {
    try {
      const { transformRawRules } = await importExtensionAdsModule();
      const rulesStored = await fetchFromStorage(ALL_ADS_RULES_STORAGE_KEY);

      if (!rulesStored) throw new Error('No rules for ads found');

      return transformRawRules(locationOrHref, rulesStored);
    } catch (error) {
      console.error(error);

      return {
        adPlacesRules: [],
        permanentAdPlacesRules: [],
        providersSelectors: [],
        providersNegativeSelectors: [],
        elementsToHideOrRemoveRules: [],
        blacklistedHypelabCampaignsSlugs: [],
        timestamp: 0
      };
    }
  },
  {
    maxAge: ADS_RULES_UPDATE_INTERVAL,
    normalizer: ([locationOrHref]) => (typeof locationOrHref === 'string' ? locationOrHref : locationOrHref.href),
    promise: true
  }
);

export const clearRulesCache = () => getRulesFromStorage.clear();
