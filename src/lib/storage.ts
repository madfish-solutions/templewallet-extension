import browser, { Storage } from 'webextension-polyfill';

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

export async function fetchManyFromStorage<K extends string, T extends Record<K, any>>(keys: K[]): Promise<Partial<T>> {
  const deprecatedKeys = keys.filter(k => DEPRECATED_KEYS.some(dk => k.startsWith(dk)));

  if (deprecatedKeys.length > 0) {
    throw new Error(`Storage keys ${deprecatedKeys.join(', ')} are deprecated`);
  }

  return (await browser.storage.local.get(keys)) as Partial<T>;
}

export async function putToStorage<T = any>(key: string, value: T) {
  return browser.storage.local.set({ [key]: value });
}

export async function putManyToStorage<T extends Record<string, any>>(values: T) {
  return browser.storage.local.set(values);
}

export async function removeFromStorage(keyOrKeys: string | string[]) {
  return browser.storage.local.remove(keyOrKeys);
}

export async function removeFromStorageByPrefix(...prefixes: string[]) {
  const storedItems = await browser.storage.local.get();
  const keysToRemove = Object.keys(storedItems).filter(key => prefixes.some(prefix => key.startsWith(prefix)));
  if (keysToRemove.length) await browser.storage.local.remove(keysToRemove);
}

export async function moveValueInStorage(oldKey: string, newKey: string) {
  const value = await fetchFromStorage(oldKey);

  await putToStorage(newKey, value);

  await removeFromStorage(oldKey);
}

export function onStorageChanged<T = any>(key: string, callback: (newValue: T) => void) {
  const handleChanged = (changes: Storage.StorageAreaOnChangedChangesType) => {
    if (key in changes) {
      // onChanged reports newValue === undefined when a key is removed.
      // Our fetcher uses null to mean “missing”, so normalize to null here.
      // This keeps SWR (with suspense) from re-suspending on storage.clear(),
      // preventing transient unmount/remount (e.g., modal flicker) during resets.
      callback((changes[key] as Storage.StorageChange).newValue ?? null);
    }
  };

  // (!) Do not sub to all storages at once (via `browser.storage.onChanged`).
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1838448#c14
  browser.storage.local.onChanged.addListener(handleChanged);

  return () => browser.storage.local.onChanged.removeListener(handleChanged);
}
