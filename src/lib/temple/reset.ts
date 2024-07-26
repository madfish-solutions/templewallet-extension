import { getStoredAppInstallIdentity, putStoredAppInstallIdentity } from 'app/storage/app-install-id';
import { browser } from 'lib/browser';
import { MISES_ACCEPT_TOS_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import * as Repo from 'lib/temple/repo';

export async function clearAllStorages() {
  await clearAsyncStorages();
  localStorage.clear();
}

export async function clearAsyncStorages() {
  await Repo.db.delete();
  await Repo.db.open();
  const appIdentity = await getStoredAppInstallIdentity();
  const userEnabledAdsForTempleOnMises = await fetchFromStorage<'true'>(MISES_ACCEPT_TOS_STORAGE_KEY);
  await browser.storage.local.clear();
  if (appIdentity) putStoredAppInstallIdentity(appIdentity);
  if (userEnabledAdsForTempleOnMises) putToStorage<'true'>(MISES_ACCEPT_TOS_STORAGE_KEY, 'true');
  await browser.storage.session?.clear();
}

export function clearLocalStorage(exceptionsKeys?: string[]) {
  const exceptions = exceptionsKeys?.map(key => [key, localStorage.getItem(key)] as const);
  localStorage.clear();
  exceptions?.forEach(([key, val]) => {
    if (val != null) localStorage.setItem(key, val);
  });
}
