import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

export interface LiquidityBakingContractAbstraction extends ContractAbstraction<ContractProvider> {
  methods: {
    xtzToToken: (
      receiverPublicKeyHash: string,
      outputTokenAmount: BigNumber,
      transactionTimeoutDate: string
    ) => ContractMethod<ContractProvider>;
    tokenToXtz: (
      receiverPublicKeyHash: string,
      inputTokenAmount: BigNumber,
      outputTezosAmount: BigNumber,
      transactionTimeoutDate: string
    ) => ContractMethod<ContractProvider>;
  };
}
