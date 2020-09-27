import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { useRetryableSWR } from "lib/swr";

export function useStorage<T = any>(
  key: string,
  fallback?: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { data, revalidate } = useRetryableSWR<T>(key, fetchOne, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useOnStorageChanged(revalidate);

  const value = fallback !== undefined ? data ?? fallback : data!;

  const setValue = React.useCallback(
    (val: React.SetStateAction<T>) => {
      browser.storage.local.set({
        [key]: typeof val === "function" ? (val as any)(value) : val,
      });
    },
    [key, value]
  );

  return React.useMemo(() => [value, setValue], [value, setValue]);
}

export function usePassiveStorage<T = any>(
  key: string,
  fallback?: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { data } = useRetryableSWR<T>(key, fetchOne, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const finalData = fallback !== undefined ? data ?? fallback : data!;

  const [value, setValue] = React.useState(finalData);
  const prevValue = React.useRef(value);

  React.useEffect(() => {
    if (prevValue.current !== value) {
      browser.storage.local.set({ [key]: value });
    }
    prevValue.current = value;
  }, [key, value]);

  return [value, setValue];
}

export function useOnStorageChanged(handleStorageChanged: () => void) {
  React.useEffect(() => {
    browser.storage.onChanged.addListener(handleStorageChanged);
    return () => browser.storage.onChanged.removeListener(handleStorageChanged);
  }, [handleStorageChanged]);
}

async function fetchOne(key: string) {
  const items = await browser.storage.local.get([key]);
  if (key in items) {
    return items[key];
  } else {
    return null;
  }
}
