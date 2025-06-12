import type { TransactionRequest as LiFiTxRequest } from '@lifi/types';
import type { Address, TransactionRequest as ViemTxRequest, RpcTransactionRequest } from 'viem';

import { EvmEstimationDataWithFallback } from 'lib/temple/types';

export function mapToEvmEstimationDataWithFallback(tx: LiFiTxRequest): EvmEstimationDataWithFallback {
  const gas = BigInt(tx.gasLimit!);

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
    nonce: typeof tx.nonce === 'number' ? tx.nonce : undefined
  };
}

export const timeout = (duration: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
};
