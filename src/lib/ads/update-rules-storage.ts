import retry from 'async-retry';
import { debounce } from 'lodash';
import memoizee from 'memoizee';

import { configureAds } from 'lib/ads/configure-ads';
import { ALL_ADS_RULES_STORAGE_KEY } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { putToStorage } from 'lib/storage';

import { importExtensionAdsModule } from './import-extension-ads-module';

const getApiInstance = memoizee(async () => {
  const { TempleAdsApi } = await importExtensionAdsModule();
  await configureAds();
  return new TempleAdsApi(EnvVars.TEMPLE_ADS_API_URL);
});

let inProgress = false;
export const updateRulesStorage = debounce(async () => {
  try {
    if (inProgress) return;

    inProgress = true;
    const rules = await retry(async () => (await getApiInstance()).getAllRules(), {
      maxTimeout: 20000,
      minTimeout: 1000
    });
    await putToStorage(ALL_ADS_RULES_STORAGE_KEY, rules);
  } catch (e) {
    console.error(e);
  } finally {
    inProgress = false;
  }
}, 50);
