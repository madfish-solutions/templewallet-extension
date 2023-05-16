import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

export interface Hop {
  amount_opt: BigNumber | null;
  dex_id: number;
  code: number;
}

export interface Route3ContractInterface extends ContractAbstraction<ContractProvider> {
  methods: {
    execute: (
      token_in_id: number,
      token_out_id: number,
      min_out: BigNumber,
      receiver: string,
      hops: Array<Hop>,
      app_id: number
    ) => ContractMethod<ContractProvider>;
  };
}
