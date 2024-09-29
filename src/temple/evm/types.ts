export interface EvmTxParams {
  to: HexString;
  value: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  nonce?: number;
}

export interface SerializableEvmTxParams extends Pick<EvmTxParams, 'to' | 'nonce'> {
  value: string;
  gas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}
