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

export type Tab = 'details' | 'fee' | 'advanced' | 'error';
