import { TezosToolkit } from '@taquito/taquito';
import pMemoize from 'p-memoize';

// TODO: reuse in frontend
export const getContract = pMemoize((address: string, tezos: TezosToolkit) => tezos.contract.at(address), {
  cacheKey: ([address, tezos]) => address
});
