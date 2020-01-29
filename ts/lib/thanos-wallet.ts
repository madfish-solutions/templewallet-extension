import * as React from "react";
import createUseContext from "constate";
import useSWR from "swr";
import { TezosToolkit } from "@taquito/taquito";
import { useBrowserStorage } from "lib/browser-storage";

export interface Account {
  email: string;
  password: string;
  mnemonic: string[];
  secret: string;
}

export const useThanosWalletContext = createUseContext(useThanosWallet);
export const ThanosWalletProvider = useThanosWalletContext.Provider;

function useThanosWallet() {
  const {
    tezos,
    initAccount,
    getBalance,
    getBalanceHistory,
    transfer
  } = useTezos();

  const [{ accountstr }, setToStorage] = useBrowserStorage("accountstr");

  const { data: maybeAccount } = useSWR(accountstr || null, initAccount, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const account = (accountstr && maybeAccount) || null;

  const importAccount = React.useCallback(
    async (acc: Account) => {
      await tezos.importKey(
        acc.email,
        acc.password,
        acc.mnemonic.join(" "),
        acc.secret
      );
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

function useTezos() {
  const tezos = React.useMemo(() => {
    const tt = new TezosToolkit();
    tt.setProvider({ rpc: "https://babylonnet.tezos.org.ua" });
    return tt;
  }, []);

  const initAccount = React.useCallback(
    async (accstr: string) => {
      const acc = JSON.parse(accstr) as Account;
      await tezos.importKey(
        acc.email,
        acc.password,
        acc.mnemonic.join(" "),
        acc.secret
      );
      const address = await tezos.signer.publicKeyHash();
      return { address };
    },
    [tezos]
  );

  const getBalance = React.useCallback(
    async (address: string) => {
      const amount = await tezos.tz.getBalance(address);
      return tezos.format("mutez", "tz", amount);
    },
    [tezos]
  );

  const getBalanceHistory = React.useCallback(
    (address: string) => tezos.query.balanceHistory(address),
    [tezos]
  );

  const transfer = React.useCallback(
    (address: string, amount: number) =>
      tezos.contract.transfer({ to: address, amount }),
    [tezos]
  );

  return { tezos, initAccount, getBalance, getBalanceHistory, transfer };
}

// const FAUCET_KEY = {
//   mnemonic: [
//     "ridge",
//     "sauce",
//     "puppy",
//     "label",
//     "flush",
//     "soldier",
//     "trophy",
//     "session",
//     "bonus",
//     "reopen",
//     "gallery",
//     "strategy",
//     "jeans",
//     "tattoo",
//     "crash"
//   ],
//   secret: "3a99071ced646378aa07ad1eb1e8808bd2447cdb",
//   amount: "4105356706",
//   pkh: "tz1Y6nPWCD16CUefkwb9Va4ASAb51HUcXCFB",
//   password: "3iHdgLfs9F",
//   email: "sdavibob.graiaovj@tezos.example.org"
// };
