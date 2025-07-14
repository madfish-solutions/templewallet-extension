import { ADS_VIEWER_DATA_STORAGE_KEY, REPLACE_REFERRALS_ENABLED, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';

// TODO: Extend logic below in TW-1792: Feature distribution control

export async function checkIfShouldReplaceAds() {
  if (window.frameElement) return false; // Prevents the scripts from running in an Iframe

  const accountDataFromStorage = await fetchFromStorage<string>(ADS_VIEWER_DATA_STORAGE_KEY);

  if (accountDataFromStorage) return await fetchFromStorage<boolean>(WEBSITES_ANALYTICS_ENABLED);

  return IS_MISES_BROWSER;
}

export async function checkIfShouldReplaceTakeAdsReferrals() {
  if (window.frameElement) return false; // Prevents the scripts from running in an Iframe

  const value = await fetchFromStorage<boolean>(REPLACE_REFERRALS_ENABLED);

  // TODO: Revert after test
  // return value && IS_MISES_BROWSER;
  return value;
}

export async function checkIfShouldReplaceTempleReferrals() {
  if (window.frameElement) return false; // Prevents the scripts from running in an Iframe

  // TODO: Set to "false" after test, for now it's unclear when this feature will be enabled
  return true;
}
