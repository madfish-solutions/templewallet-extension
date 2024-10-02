import BigNumber from 'bignumber.js';

export interface EvmTxParamsFormData {
  gasPrice: string;
  gasLimit: string;
  nonce: string;
}

export interface TezosTxParamsFormData {
  gasFee: string;
  storageLimit: string;
  rawTransaction: string;
}

export type TxParamsFormData = EvmTxParamsFormData | TezosTxParamsFormData;

export type FeeOptionLabel = 'slow' | 'mid' | 'fast';

export interface DisplayedFeeOptions {
  slow: string;
  mid: string;
  fast: string;
}

export interface EvmEstimationData {
  estimatedFee: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface TezosEstimationData {
  gasFee: BigNumber;
}
