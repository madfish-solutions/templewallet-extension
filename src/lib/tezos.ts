import * as React from "react";
import createUseContext from "constate";
import { TezosToolkit } from "@taquito/taquito";

export interface TezosAccount {
  email: string;
  password: string;
  mnemonic: string[];
  secret: string;
}

export const useTezosContext = createUseContext(useTezos);
export const TezosProvider = useTezosContext.Provider;

function useTezos() {
  const tezos = React.useMemo(() => {
    const tt = new TezosToolkit();
    tt.setProvider({
      rpc: "https://babylonnet.tezos.org.ua",
      indexer: "https://api.tez.ie/indexer/babylonnet"
    });
    return tt;
  }, []);

  const initAccount = React.useCallback(
    async (accstr: string) => {
      const acc = JSON.parse(accstr) as TezosAccount;
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
