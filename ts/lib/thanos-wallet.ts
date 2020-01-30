import * as React from "react";
import createUseContext from "constate";
import useSWR from "swr";
import { useBrowserStorage } from "lib/browser-storage";
import { TezosAccount, useTezosContext } from "lib/tezos";

export const useThanosWalletContext = createUseContext(useThanosWallet);
export const ThanosWalletProvider = useThanosWalletContext.Provider;

function useThanosWallet() {
  const {
    tezos,
    initAccount,
    getBalance,
    getBalanceHistory,
    transfer
  } = useTezosContext();

  const [{ accountstr }, setToStorage] = useBrowserStorage("accountstr");

  const { data: maybeAccount } = useSWR(accountstr || null, initAccount, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const account = (accountstr && maybeAccount) || null;

  const importAccount = React.useCallback(
    async (acc: TezosAccount) => {
      if (
        ![
          typeof acc.email === "string" && acc.email,
          typeof acc.password === "string" && acc.password,
          Array.isArray(acc.mnemonic),
          typeof acc.secret === "string" && acc.secret
        ].every(Boolean)
      ) {
        throw new Error("Invalid key");
      }
      setToStorage({ accountstr: JSON.stringify(acc) });
    },
    [setToStorage]
  );

  const destroyAccount = React.useCallback(
    () => setToStorage({ accountstr: null }),
    []
  );

  return {
    tezos,
    getBalance,
    account,
    importAccount,
    destroyAccount,
    getBalanceHistory,
    transfer
  };
}
