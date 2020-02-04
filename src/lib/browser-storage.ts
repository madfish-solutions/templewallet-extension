import * as React from "react";
import { browser, Storage } from "webextension-polyfill-ts";
import useSWR from "swr";

type BrowserStorageKeys = string[];

export function useBrowserStorage(
  ...keys: BrowserStorageKeys
): [{ [s: string]: any }, typeof browser.storage.local.set] {
  const storageSWR = useSWR(keys, getFromStorage, { suspense: true });

  React.useEffect(() => {
    browser.storage.onChanged.addListener(handleStorageChanged);
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChanged);
    };

    function handleStorageChanged() {
      storageSWR.revalidate();
    }
  }, [storageSWR]);

  const set = React.useCallback(
    (items: Storage.StorageAreaSetItemsType) =>
      browser.storage.local.set(items),
    []
  );

  return [storageSWR.data!, set];
}

function getFromStorage(...keys: BrowserStorageKeys) {
  return browser.storage.local.get(keys);
}
