import { ADS_VIEWER_DATA_STORAGE_KEY, REPLACE_REFERRALS_ENABLED, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';

export function checkIfShouldReplaceAds() {
  return runInMainWindow(async () => {
    const accountDataFromStorage = await fetchFromStorage<string>(ADS_VIEWER_DATA_STORAGE_KEY);
    const websitesAnalyticsEnabled = await fetchFromStorage<boolean>(WEBSITES_ANALYTICS_ENABLED);

    if (accountDataFromStorage) return websitesAnalyticsEnabled ?? false;

    return IS_MISES_BROWSER;
  });
}

export function checkIfShouldReplaceTakeAdsReferrals() {
  return runInMainWindow(async () => {
    const value = await fetchFromStorage<boolean>(REPLACE_REFERRALS_ENABLED);
    return value ?? IS_MISES_BROWSER;
  });
}

export function checkIfShouldReplaceTempleReferrals() {
  // For now, it's unclear when this feature will be enabled
  return runInMainWindow(() => Promise.resolve(false));
}

async function runInMainWindow(callback: () => Promise<boolean>) {
  if (window.frameElement) return false; // Prevents the scripts from running in an Iframe

  return callback();
}
