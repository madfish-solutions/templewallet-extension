import type { TransactionRequest as LiFiTxRequest } from '@lifi/types';
import type { Address, TransactionRequest as ViemTxRequest, RpcTransactionRequest } from 'viem';

import { EvmEstimationDataWithFallback } from 'lib/temple/types';

export function mapLiFiTxToEvmEstimationData(tx: LiFiTxRequest): EvmEstimationDataWithFallback {
  const gasLimitStr = 'gasLimit' in tx ? tx.gasLimit : undefined;
  const gasPriceStr = 'gasPrice' in tx ? tx.gasPrice : undefined;

  const gasLimit = gasLimitStr ? BigInt(gasLimitStr) : BigInt(0);
  const gasPrice = gasPriceStr ? BigInt(gasPriceStr) : BigInt(0);

  return {
    estimatedFee: gasLimit * gasPrice,
    data: (tx.data ?? '0x') as HexString,
    type: 'legacy',
    gas: gasLimit,
    gasPrice: gasPrice,
    nonce: 0
  };
}

export function parseTxRequestToViem(tx: LiFiTxRequest | RpcTransactionRequest): ViemTxRequest | null {
  const gasLimit = 'gasLimit' in tx ? tx.gasLimit : undefined;
  const gas = 'gas' in tx ? tx.gas : undefined;

  let nonceNum: number | undefined = undefined;
  if (typeof tx.nonce === 'number') {
    nonceNum = tx.nonce;
  } else if (typeof tx.nonce === 'string') {
    const parsedNonce = Number(tx.nonce);
    nonceNum = Number.isNaN(parsedNonce) ? undefined : parsedNonce;
  }

  const baseTx = {
    from: tx.from as Address,
    to: tx.to as Address,
    data: tx.data as HexString,
    value: tx.value ? BigInt(tx.value) : undefined,
    gas: gasLimit !== undefined ? BigInt(gasLimit) : gas !== undefined ? BigInt(gas) : undefined,
    nonce: nonceNum
  };

  if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
    return {
      ...baseTx,
      maxFeePerGas: BigInt(tx.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas)
    };
  }

  if (tx.gasPrice) {
    return {
      ...baseTx,
      gasPrice: BigInt(tx.gasPrice)
    };
  }

  return null;
}

export const timeout = (duration: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
};
