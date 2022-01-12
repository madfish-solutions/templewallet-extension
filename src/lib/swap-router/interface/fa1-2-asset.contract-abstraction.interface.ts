import { ContractAbstraction, ContractProvider, ContractMethod } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

export interface Fa12AssetContractAbstraction extends ContractAbstraction<ContractProvider> {
  methods: {
    approve: (whomToApprove: string, assetAmountToApprove: BigNumber) => ContractMethod<ContractProvider>;
    transfer: (
      senderPublicKeyHash: string,
      receiverPublicKeyHash: string,
      tokenAmount: BigNumber
    ) => ContractMethod<ContractProvider>;
  };
}
