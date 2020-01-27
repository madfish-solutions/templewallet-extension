import * as React from "react";
import { useAsync } from "react-async";
import { browser, Storage } from "webextension-polyfill-ts";

type BrowserStorageKeys =
  | string
  | string[]
  | { [s: string]: any }
  | null
  | undefined;

export function useBrowserStorage(keys?: BrowserStorageKeys) {
  const storageAsync = useAsync({
    suspense: false,
    promiseFn: getFromStorage,
    keys
  });

  React.useEffect(() => {
    browser.storage.onChanged.addListener(handleStorageChanged);
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChanged);
    };

    function handleStorageChanged() {
      storageAsync.reload();
    }
  }, [storageAsync]);

  const setToStorage = React.useCallback(
    (items: Storage.StorageAreaSetItemsType) => {
      return browser.storage.local.set(items);

      // return (
      //   (() => {
      //     switch (true) {
      //       case typeof keys === "string":
      //         return { [keys as string]: items };

      //       case Array.isArray(keys):
      //         return (keys as string[]).reduce((its, k) => ({ ...its, [k]: items[k] }), {});

      //       default
      //     }
      //   })()
      // )
    },
    []
  );

  return [storageAsync.value!, setToStorage];
}

function getFromStorage({ keys }: any) {
  return browser.storage.local.get(keys);
}

// function setToStorage({ items }: { items: Storage.StorageAreaSetItemsType }) {
//   return browser.storage.local.set(items);
// }
