import { getMisesInstallEnabledAds } from 'app/storage/mises-browser';
import { ADS_VIEWER_ADDRESS_STORAGE_KEY, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

export async function checkIfShouldReplaceAds() {
  if (window.frameElement) return false; // Prevents the scripts from running in an Iframe

  const accountPkhFromStorage = await fetchFromStorage<string>(ADS_VIEWER_ADDRESS_STORAGE_KEY);

  if (accountPkhFromStorage) return await fetchFromStorage<boolean>(WEBSITES_ANALYTICS_ENABLED);

  return await getMisesInstallEnabledAds();
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
