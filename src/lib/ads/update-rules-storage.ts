import { TempleWalletApi } from '@temple-wallet/extension-ads';
import retry from 'async-retry';
import { debounce } from 'lodash';

import { ALL_ADS_RULES_STORAGE_KEY } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { putToStorage } from 'lib/storage';

const api = new TempleWalletApi(EnvVars.TEMPLE_WALLET_API_URL);

let inProgress = false;
export const updateRulesStorage = debounce(async () => {
  try {
    if (inProgress) return;

    inProgress = true;
    const rules = await retry(async () => api.getAllRules(), { maxTimeout: 20000, minTimeout: 1000 });
    await putToStorage(ALL_ADS_RULES_STORAGE_KEY, rules);
  } catch (e) {
    console.error(e);
  } finally {
    inProgress = false;
  }
}, 50);
