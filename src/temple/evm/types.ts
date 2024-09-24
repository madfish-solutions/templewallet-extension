export interface EvmTxParams {
  to: HexString;
  amount: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface SerializableEvmTxParams extends Pick<EvmTxParams, 'to'> {
  amount: string;
  gas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}
