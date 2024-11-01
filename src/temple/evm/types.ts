export interface EvmTxParams {
  to: HexString;
  data?: HexString;
  value: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  nonce?: number;
}

export interface SerializableEvmTxParams extends Pick<EvmTxParams, 'to' | 'nonce'> {
  value: string;
  gas: string;
  data?: HexString;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}
