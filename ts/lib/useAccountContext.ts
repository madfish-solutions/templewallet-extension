import * as React from "react";
import createUseContext from "constate";

export default createUseContext(useAccount);

const ACC_FIELDS = ["mnemonic", "email", "secret", "pkh", "password"];

function useAccount() {
  const [{ initialized, account }, setState] = React.useState(() => ({
    initialized: false,
    account: null
  }));

  const getAccFromStorage = React.useCallback(
    () =>
      new Promise(res => {
        chrome.storage.sync.get(ACC_FIELDS, res);
      }),
    []
  );

  const setAccToStorage = React.useCallback(
    acc =>
      new Promise(res => {
        chrome.storage.sync.set(acc, res);
      }),
    []
  );

  const removeAccFromStorage = React.useCallback(
    () =>
      new Promise(res => {
        chrome.storage.sync.remove(ACC_FIELDS, res);
      }),
    []
  );

  const setup = React.useCallback(
    acc => {
      setState({
        account: acc && isAccValid(acc) ? acc : null,
        initialized: true
      });
    },
    [setState]
  );

  React.useEffect(() => {
    (async () => {
      let initialAcc;
      try {
        initialAcc = await getAccFromStorage();
      } catch (_err) {}
      setup(initialAcc);

      chrome.storage.onChanged.addListener(handleStorageChanged);
    })();

    return chrome.storage.onChanged.removeListener(handleStorageChanged);

    async function handleStorageChanged() {
      let acc;
      try {
        acc = await getAccFromStorage();
      } catch (_err) {}
      setup(acc);
    }
  }, [setup]);

  const save = setAccToStorage;
  const clean = removeAccFromStorage;
  return {
    initialized,
    account,
    setup,
    save,
    clean
  };
}

function isAccValid(acc: any) {
  return ACC_FIELDS.every(field => Boolean(acc[field]));
}
