import memoize from "micro-memoize";
import { TezosToolkit } from "@taquito/taquito";

export const loadContract = memoize(fetchContract, {
  isPromise: true,
  maxSize: 100,
});

export function fetchContract(tezos: TezosToolkit, address: string) {
  return tezos.wallet.at(address);
}
