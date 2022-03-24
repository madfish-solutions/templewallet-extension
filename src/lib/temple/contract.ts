import { TezosToolkit, WalletContract } from '@taquito/taquito';
import memoize from 'micro-memoize';

export const loadContract = memoize(fetchContract, {
  isPromise: true,
  maxSize: 100
});

export function fetchContract(tezos: TezosToolkit, address: string, walletAPI = true): Promise<WalletContract> {
  return walletAPI ? tezos.wallet.at(address) : (tezos.contract.at(address) as any);
}
