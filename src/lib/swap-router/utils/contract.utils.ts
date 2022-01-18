import { ContractAbstraction, ContractProvider, TezosToolkit } from '@taquito/taquito';
import pMemoize from 'p-memoize';

export const getContract = pMemoize(
  <T extends ContractAbstraction<ContractProvider>>(address: string, tezos: TezosToolkit) =>
    tezos.contract.at<T>(address),
  {
    cacheKey: ([address, tezos]) => address
  }
);
