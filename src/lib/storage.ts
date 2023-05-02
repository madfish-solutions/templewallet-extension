import browser from 'webextension-polyfill';

// Remove from `browser.storage.local`: 'tokens_base_metadata', `detailed_asset_metadata_${slug}`
// Remove from `LocalStorage`: `no_metadata_${slug}`

export async function fetchFromStorage<T = any>(key: string): Promise<T | null> {
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
