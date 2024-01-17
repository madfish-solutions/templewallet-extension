import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
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

export function usePassiveStorage<T = any>(key: string): [T | null | undefined, Dispatch<SetStateAction<T>>];
export function usePassiveStorage<T = any>(
  key: string,
  fallback: T,
  shouldPutFallback?: boolean
): [T, Dispatch<SetStateAction<T>>];
export function usePassiveStorage<T = any>(key: string, fallback?: T, shouldPutFallback = false) {
  const { data } = useRetryableSWR<T | null, unknown, string>(key, fetchFromStorage, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const finalData = fallback === undefined ? data : data ?? fallback;

  const [value, setValue] = useState(finalData);

  useEffect(() => {
    if (!isDefined(data) && isDefined(fallback) && shouldPutFallback) {
      putToStorage(key, fallback);
    }
  }, [data, fallback, key, shouldPutFallback]);

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
  const handleChanged = (
    changes: {
      [s: string]: Storage.StorageChange;
    },
    areaName: string
  ) => {
    if (areaName === 'local' && key in changes) {
      callback(changes[key].newValue);
    }
  };
  browser.storage.onChanged.addListener(handleChanged);
  return () => browser.storage.onChanged.removeListener(handleChanged);
}
