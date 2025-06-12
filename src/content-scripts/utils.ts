import { ADS_VIEWER_ADDRESS_STORAGE_KEY, REPLACE_REFERRALS_ENABLED, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';

export async function checkIfShouldReplaceAds() {
  if (window.frameElement) return false; // Prevents the scripts from running in an Iframe

  const accountPkhFromStorage = await fetchFromStorage<string>(ADS_VIEWER_ADDRESS_STORAGE_KEY);

  if (accountPkhFromStorage) return await fetchFromStorage<boolean>(WEBSITES_ANALYTICS_ENABLED);

  return IS_MISES_BROWSER;
}

export async function checkIfShouldReplaceReferrals() {
  if (window.frameElement) return false; // Prevents the scripts from running in an Iframe

  const value = await fetchFromStorage<boolean>(REPLACE_REFERRALS_ENABLED);

  return value && IS_MISES_BROWSER;
}

export function throttleAsyncCalls<F extends (...args: any[]) => any>(
  func: F
): (...args: Parameters<F>) => Promise<void> {
  let settling = false;

  return async function (...args: Parameters<F>) {
    if (settling) return;
    settling = true;

    try {
      await func(...args);
      return;
    } finally {
      settling = false;
    }
  };
}
