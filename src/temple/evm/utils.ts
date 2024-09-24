import { EvmTxParams, SerializableEvmTxParams } from './types';

export const toSerializableEvmTxParams = (txParams: EvmTxParams): SerializableEvmTxParams => ({
  to: txParams.to,
  amount: txParams.amount.toString(),
  gas: txParams.gas.toString(),
  maxFeePerGas: txParams.maxFeePerGas.toString(),
  maxPriorityFeePerGas: txParams.maxPriorityFeePerGas.toString()
});

export const fromSerializableEvmTxParams = (txParams: SerializableEvmTxParams): EvmTxParams => ({
  to: txParams.to,
  amount: BigInt(txParams.amount),
  gas: BigInt(txParams.gas),
  maxFeePerGas: BigInt(txParams.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(txParams.maxPriorityFeePerGas)
});
