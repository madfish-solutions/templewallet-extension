import { APP_INSTALL_IDENTITY_STORAGE_KEY } from 'app/storage/app-install-id';
import { MISES_INSTALL_ENABLED_ADS_STORAGE_KEY } from 'app/storage/mises-browser';
import { browser } from 'lib/browser';
import * as ActivityRepo from 'lib/temple/activity/repo';
import * as Repo from 'lib/temple/repo';

export async function clearAllStorages() {
  await clearAsyncStorages();
  localStorage.clear();
}

export async function clearAsyncStorages() {
  await Repo.db.delete();
  await Repo.db.open();
  await ActivityRepo.db.delete();
  await ActivityRepo.db.open();
  const keptRecord = await browser.storage.local.get([
    APP_INSTALL_IDENTITY_STORAGE_KEY,
    MISES_INSTALL_ENABLED_ADS_STORAGE_KEY
  ]);
  await browser.storage.local.clear();
  await browser.storage.local.set(keptRecord);
  await browser.storage.session?.clear();
}

export function clearLocalStorage(exceptionsKeys?: string[]) {
  const exceptions = exceptionsKeys?.map(key => [key, localStorage.getItem(key)] as const);
  localStorage.clear();
  exceptions?.forEach(([key, val]) => {
    if (val != null) localStorage.setItem(key, val);
  });
}
