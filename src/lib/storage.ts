import { useEffect, useState } from 'react';

import browser from 'webextension-polyfill';

const DEPRECATED_KEYS = [
  'tokens_base_metadata',
  'detailed_asset_metadata_' // `detailed_asset_metadata_${slug}`
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

export function useStorageValue<T>(key: string) {
  const [value, setValue] = useState<T | nullish>();

  useEffect(() => {
    const listener: Parameters<browser.Storage.Static['onChanged']['addListener']>[0] = (data, areaName) => {
      if (areaName !== 'local') return;

      const changes = data[key];
      if (!changes) return;

      setValue(changes.newValue);
    };

    fetchFromStorage<T>(key).then(value => {
      setValue(value);

      browser.storage.onChanged.addListener(listener);
    });

    return () => void browser.storage.onChanged.removeListener(listener);
  }, [key]);

  return value;
}
