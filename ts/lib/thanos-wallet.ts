import * as React from "react";
import createUseContext from "constate";
import { TezosToolkit } from "@taquito/taquito";

export const useThanosWalletContext = createUseContext(useThanosWallet);
export const ThanosWalletProvider = useThanosWalletContext.Provider;

function useThanosWallet() {
  const tezos = React.useMemo(() => new TezosToolkit(), []);

  // conseilJsLoaded,
  // initializeAccount,
  // isAccountRevealed,
  // activateAccount,
  // getTotalBalance,
  // getAccount,
  // getTransactions,
  // sendTransaction
  return {
    tezos
  };
}
