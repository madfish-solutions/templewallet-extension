import type { TransactionRequest as LiFiTxRequest } from '@lifi/types';
import type { Address, TransactionRequest as ViemTxRequest, RpcTransactionRequest } from 'viem';

import { EvmEstimationDataWithFallback } from 'lib/temple/types';

export function mapToEvmEstimationDataWithFallback(tx: LiFiTxRequest): EvmEstimationDataWithFallback {
  const gas = BigInt(tx.gasLimit!);

  if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
    return {
      type: 'eip1559',
      gas,
      estimatedFee: gas * BigInt(tx.maxFeePerGas),
      maxFeePerGas: BigInt(tx.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
      data: (tx.data ?? '0x') as HexString,
      nonce: Number(tx.nonce ?? 0)
    };
  }

  if (tx.accessList && tx.type === 1) {
    return {
      type: 'eip2930',
      gas,
      estimatedFee: gas * BigInt(tx.gasPrice!),
      gasPrice: BigInt(tx.gasPrice!),
      data: (tx.data ?? '0x') as HexString,
      nonce: Number(tx.nonce ?? 0)
    };
  }

  return {
    type: 'legacy',
    gas,
    estimatedFee: gas * BigInt(tx.gasPrice!),
    gasPrice: BigInt(tx.gasPrice!),
    data: (tx.data ?? '0x') as HexString,
    nonce: Number(tx.nonce ?? 0)
  };
}

export function parseLiFiTxRequestToViem(tx: LiFiTxRequest | RpcTransactionRequest): ViemTxRequest {
  const gasLimit = 'gasLimit' in tx ? tx.gasLimit : undefined;
  const gas = 'gas' in tx ? tx.gas : undefined;

  return {
    from: tx.from as Address,
    to: tx.to as Address,
    data: tx.data as HexString,
    value: tx.value ? BigInt(tx.value) : undefined,
    gas: gasLimit !== undefined ? BigInt(gasLimit) : gas !== undefined ? BigInt(gas) : undefined,
    gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
    // maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
    // maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined,
    nonce: typeof tx.nonce === 'number' ? tx.nonce : undefined,
    accessList: tx.accessList?.map(item => ({
      address: item.address as HexString,
      storageKeys: item.storageKeys.map(k => k as HexString) as readonly HexString[]
    }))
  };
}

export const timeout = (duration: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
};
