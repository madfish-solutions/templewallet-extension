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
  raw: object;
  bytes: string;
}

export type TxParamsFormData = EvmTxParamsFormData | TezosTxParamsFormData;

export type FeeOptionLabel = 'slow' | 'mid' | 'fast';

export interface DisplayedFeeOptions {
  slow: string;
  mid: string;
  fast: string;
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
