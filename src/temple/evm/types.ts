export interface EvmTxParams {
  to: HexString;
  value: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface SerializableEvmTxParams extends Pick<EvmTxParams, 'to'> {
  value: string;
  gas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}
