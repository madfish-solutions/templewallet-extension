import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import useSWR from "swr";

export default function usePassiveStorage<T = any>(
  key: string,
  fallback?: T
): [T, React.Dispatch<T>] {
  const { data } = useSWR<T>(key, fetchOne, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
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

async function fetchOne(key: string) {
  const items = await browser.storage.local.get([key]);
  if (key in items) {
    return items[key];
  } else {
    return null;
  }
}
