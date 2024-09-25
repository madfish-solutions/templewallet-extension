import { EvmTxParams, SerializableEvmTxParams } from './types';

export function toSerializableEvmTxParams(txParams: EvmTxParams): SerializableEvmTxParams {
  return {
    to: txParams.to,
    amount: txParams.amount.toString(),
    gas: txParams.gas.toString(),
    maxFeePerGas: txParams.maxFeePerGas.toString(),
    maxPriorityFeePerGas: txParams.maxPriorityFeePerGas.toString()
  };
}

export function fromSerializableEvmTxParams(txParams: SerializableEvmTxParams): EvmTxParams {
  return {
    to: txParams.to,
    amount: BigInt(txParams.amount),
    gas: BigInt(txParams.gas),
    maxFeePerGas: BigInt(txParams.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(txParams.maxPriorityFeePerGas)
  };
}

export function getGasPriceStep(averageGasPrice: bigint) {
  return BigInt(`1${'0'.repeat(averageGasPrice.toString().length - 2)}`);
}
