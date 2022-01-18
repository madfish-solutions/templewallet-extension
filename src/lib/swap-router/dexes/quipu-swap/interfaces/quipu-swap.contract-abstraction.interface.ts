import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

export interface QuipuSwapContractAbstraction extends ContractAbstraction<ContractProvider> {
  methods: {
    tezToTokenPayment: (
      outputTokenAmount: BigNumber,
      receiverPublicKeyHash: string
    ) => ContractMethod<ContractProvider>;
    tokenToTezPayment: (
      inputTokenAmount: BigNumber,
      outputTezosAmount: BigNumber,
      receiverPublicKeyHash: string
    ) => ContractMethod<ContractProvider>;
  };
}
