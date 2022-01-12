import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

export interface QuipuSwapContractAbstraction extends ContractAbstraction<ContractProvider> {
  methods: {
    tezToTokenPayment: (
      tokenOutputAmount: BigNumber,
      receiverPublicKeyHash: string
    ) => ContractMethod<ContractProvider>;
    tokenToTezPayment: (
      tokenInputAmount: BigNumber,
      tezosOutputAmount: BigNumber,
      receiverPublicKeyHash: string
    ) => ContractMethod<ContractProvider>;
  };
}
