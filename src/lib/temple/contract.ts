import { TezosToolkit } from '@taquito/taquito';
import memoizee from 'memoizee';

export const loadContract = memoizee(fetchContract, {
  promise: true,
  max: 100
});

function fetchContract(tezos: TezosToolkit, address: string, walletAPI = true) {
  return walletAPI ? tezos.wallet.at(address) : tezos.contract.at(address);
}
