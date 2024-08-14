import browser from 'webextension-polyfill';

const DEPRECATED_KEYS = [
  'detailed_asset_metadata_', // `detailed_asset_metadata_${slug}`
  'collectibles-grid:show-items-details',
  'collectibles:adult-blur'
];

export async function fetchFromStorage<T = any>(key: string): Promise<T | null> {
  if (DEPRECATED_KEYS.some(k => key.startsWith(k))) throw new Error(`Storage key ${key} is deprecated`);

  const items = await browser.storage.local.get([key]);
  if (key in items) {
    return items[key];
  } else {
    return null;
  }
}

export async function putToStorage<T = any>(key: string, value: T) {
  return browser.storage.local.set({ [key]: value });
}

export async function removeFromStorage(keyOrKeys: string | string[]) {
  return browser.storage.local.remove(keyOrKeys);
}

export async function moveValueInStorage(oldKey: string, newKey: string) {
  const value = await fetchFromStorage(oldKey);

  await putToStorage(newKey, value);

  await removeFromStorage(oldKey);
}
