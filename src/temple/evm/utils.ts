import { EvmTxParams, SerializableEvmTxParams } from './types';

export function toSerializableEvmTxParams(txParams: EvmTxParams): SerializableEvmTxParams {
  return {
    to: txParams.to,
    value: txParams.value.toString(),
    gas: txParams.gas.toString(),
    maxFeePerGas: txParams.maxFeePerGas.toString(),
    maxPriorityFeePerGas: txParams.maxPriorityFeePerGas.toString(),
    nonce: txParams.nonce
  };
}

export function fromSerializableEvmTxParams(txParams: SerializableEvmTxParams): EvmTxParams {
  return {
    to: txParams.to,
    value: BigInt(txParams.value),
    gas: BigInt(txParams.gas),
    maxFeePerGas: BigInt(txParams.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(txParams.maxPriorityFeePerGas),
    nonce: txParams.nonce
  };
}

export function getGasPriceStep(averageGasPrice: bigint) {
  const repeatCount = averageGasPrice.toString().length - 2;

  return BigInt(`1${'0'.repeat(repeatCount > 0 ? repeatCount : 0)}`);
}
