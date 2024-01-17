import { TezosToolkit } from '@taquito/taquito';
import memoize from 'micro-memoize';

export const loadContract = memoize(fetchContract, {
  isPromise: true,
  maxSize: 100
});

function fetchContract(tezos: TezosToolkit, address: string, walletAPI = true) {
  return walletAPI ? tezos.wallet.at(address) : tezos.contract.at(address);
}
