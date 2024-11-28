import { SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import browser, { Storage } from 'webextension-polyfill';

import { fetchFromStorage, putToStorage } from 'lib/storage';
import { useRetryableSWR } from 'lib/swr';
import { useDidUpdate } from 'lib/ui/hooks';

export function useStorage<T = any>(key: string): [T | null | undefined, (val: SetStateAction<T>) => Promise<void>];
export function useStorage<T = any>(key: string, fallback: T): [T, (val: SetStateAction<T>) => Promise<void>];
export function useStorage<T = any>(key: string, fallback?: T) {
  const { data, mutate } = useRetryableSWR<T | null, unknown, string>(key, fetchFromStorage, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  useEffect(() => onStorageChanged(key, mutate), [key, mutate]);

  const value = fallback === undefined ? data : data ?? fallback;
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const setValue = useCallback(
    async (val: SetStateAction<T>) => {
      const nextValue = typeof val === 'function' ? (val as any)(valueRef.current) : val;
      await putToStorage(key, nextValue);
      valueRef.current = nextValue;
    },
    [key]
  );

  return useMemo(() => [value, setValue], [value, setValue]);
}

export function usePassiveStorage<T = any>(key: string): [T | null | undefined, SyncFn<T>];
export function usePassiveStorage<T = any>(key: string, fallback: T): [T, SyncFn<T>];
export function usePassiveStorage<T = any>(key: string, fallback?: T) {
  const { data } = useRetryableSWR<T | null, unknown, string>(key, fetchFromStorage, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const finalData = fallback === undefined ? data : data ?? fallback;

  const [value, setValue] = useState(finalData);

  useDidUpdate(() => {
    setValue(finalData);
  }, [finalData]);

  const updateValue = useCallback(
    (newValue: T | null | undefined) => {
      const newValueWithFallback = fallback === undefined ? newValue : newValue ?? fallback;
      putToStorage(key, newValueWithFallback);
      setValue(newValueWithFallback);
    },
    [fallback, key]
  );

  return [value, updateValue];
}

function onStorageChanged<T = any>(key: string, callback: (newValue: T) => void) {
  const handleChanged = ((changes: { [s: string]: Storage.StorageChange }) => {
    if (key in changes) {
      callback(changes[key].newValue as any);
    }
  }) as unknown as (changes: Storage.StorageAreaOnChangedChangesType) => void;

  // (!) Do not sub to all storages at once (via `browser.storage.onChanged`).
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1838448#c14
  browser.storage.local.onChanged.addListener(handleChanged);

  return () => browser.storage.local.onChanged.removeListener(handleChanged);
}
