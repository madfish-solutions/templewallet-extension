import browser, { type Storage } from 'webextension-polyfill';

export const onStorageKey = <T = unknown>(key: string, onChange: (newValue: T | undefined) => void): EmptyFn => {
  const listener = (changes: StringRecord<Storage.StorageChange>, areaName: string) => {
    if (areaName !== 'local') return;
    if (key in changes) {
      const newValue: T | undefined = changes[key].newValue;
      onChange(newValue);
    }
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
};
