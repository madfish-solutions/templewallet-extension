import { browser } from 'lib/browser';
import * as Repo from 'lib/temple/repo';

export async function clearAllStorages() {
  await clearAsyncStorages();
  localStorage.clear();
}

export async function clearAsyncStorages() {
  await Repo.db.delete();
  await Repo.db.open();
  await browser.storage.local.clear();
  await browser.storage.session?.clear();
}

export function clearLocalStorage(exceptionsKeys?: string[]) {
  const exceptions = exceptionsKeys?.map(key => [key, localStorage.getItem(key)] as const);
  localStorage.clear();
  exceptions?.forEach(([key, val]) => {
    if (val != null) localStorage.setItem(key, val);
  });
}
