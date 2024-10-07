import BigNumber from 'bignumber.js';

export interface EvmTxParamsFormData {
  gasPrice: string;
  gasLimit: string;
  nonce: string;
  data: string;
  rawTransaction: string;
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
  data: string;
  nonce: number;
}

interface EvmFeeOption {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface EvmFeeOptions {
  displayed: DisplayedFeeOptions;
  gasPrice: {
    slow: EvmFeeOption;
    mid: EvmFeeOption;
    fast: EvmFeeOption;
  };
}

export interface TezosEstimationData {
  gasFee: BigNumber;
}
