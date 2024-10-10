interface TxParamsFormDataBase {
  rawTransaction: string;
}

export interface EvmTxParamsFormData extends TxParamsFormDataBase {
  gasPrice: string;
  gasLimit: string;
  nonce: string;
  data: string;
}

export interface TezosTxParamsFormData extends TxParamsFormDataBase {
  gasFee: string;
  storageLimit: string;
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
