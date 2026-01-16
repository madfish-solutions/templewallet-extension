import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import browser, { Storage } from 'webextension-polyfill';

import { fetchFromStorage, putToStorage } from 'lib/storage';
import { useRetryableSWR } from 'lib/swr';
import { useDidUpdate } from 'lib/ui/hooks';

type StorageValueBase = string | object | number | boolean | nullish;

/**
 * Action type for setting storage values.
 * Can be either a direct value or a function that receives the current storage state.
 *
 * @template T - The type of value being stored
 * @param value - The current value that is stored in the storage
 * @param transientValue - The value that is going to be written into storage (may be different from stored value during
 * writing into storage)
 */
type SetStorageAction<T extends StorageValueBase> = T | ((value: T, transientValue: T) => void);

export function useStorage<T extends StorageValueBase = any>(
  key: string
): [T | nullish, (val: SetStorageAction<T>) => Promise<void>];
export function useStorage<T extends StorageValueBase = any>(
  key: string,
  fallback: T
): [T, (val: SetStorageAction<T>) => Promise<void>];
export function useStorage<T extends StorageValueBase = any>(key: string, fallback?: T) {
  const { data, mutate } = useRetryableSWR<T | null, unknown, string>(key, fetchFromStorage, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  useEffect(() => onStorageChanged(key, mutate), [key, mutate]);

  const value = fallback === undefined ? data : data ?? fallback;
  const valueRef = useRef(value);
  const transientValueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
    transientValueRef.current = value;
  }, [value]);
  const setValue = useCallback(
    async (val: SetStorageAction<T>) => {
      const nextValue = typeof val === 'function' ? val(valueRef.current!, transientValueRef.current!) : val;
      transientValueRef.current = nextValue;
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
      // onChanged reports newValue === undefined when a key is removed.
      // Our fetcher uses null to mean “missing”, so normalize to null here.
      // This keeps SWR (with suspense) from re-suspending on storage.clear(),
      // preventing transient unmount/remount (e.g., modal flicker) during resets.
      callback(changes[key].newValue ?? null);
    }
  }) as unknown as (changes: Storage.StorageAreaOnChangedChangesType) => void;

  // (!) Do not sub to all storages at once (via `browser.storage.onChanged`).
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1838448#c14
  browser.storage.local.onChanged.addListener(handleChanged);

  return () => browser.storage.local.onChanged.removeListener(handleChanged);
}
