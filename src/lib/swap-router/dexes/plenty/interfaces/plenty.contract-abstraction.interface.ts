import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

export interface PlentyContractAbstraction extends ContractAbstraction<ContractProvider> {
  methods: {
    Swap: (
      outputTokenAmount: BigNumber,
      receiverPublicKeyHash: string,
      outputTokenAddress: string,
      outputTokenId: string,
      inputTokenAmount: BigNumber
    ) => ContractMethod<ContractProvider>;
  };
}
