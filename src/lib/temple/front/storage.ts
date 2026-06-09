import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchFromStorage, onStorageChanged, putToStorage } from 'lib/storage';
import { useInitialSuspenseSWR } from 'lib/swr';
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
  const { data, mutate } = useInitialSuspenseSWR<T | null, unknown, string>(
    key,
    fetchFromStorage,
    getInitialStoragePromise<T>(key),
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  useEffect(() => onStorageChanged(key, mutate), [key, mutate]);

  const value = fallback === undefined ? data : (data ?? fallback);
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
  const { data } = useInitialSuspenseSWR<T | null, unknown, string>(
    key,
    fetchFromStorage,
    getInitialStoragePromise<T>(key),
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const finalData = fallback === undefined ? data : (data ?? fallback);

  const [value, setValue] = useState<T | null | undefined>(finalData);

  useDidUpdate(() => {
    setValue(finalData);
  }, [finalData]);

  const updateValue = useCallback(
    (newValue: T | null | undefined) => {
      const newValueWithFallback = fallback === undefined ? newValue : (newValue ?? fallback);
      putToStorage(key, newValueWithFallback);
      setValue(newValueWithFallback);
    },
    [fallback, key]
  );

  return [value, updateValue];
}

const initialStoragePromises = new Map<string, Promise<any>>();

function getInitialStoragePromise<T>(key: string) {
  if (!initialStoragePromises.has(key)) {
    initialStoragePromises.set(key, fetchFromStorage<T>(key));
  }
  return initialStoragePromises.get(key) as Promise<T | null>;
}
