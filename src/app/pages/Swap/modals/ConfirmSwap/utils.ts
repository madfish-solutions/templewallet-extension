import type { TransactionRequest as LiFiTxRequest } from '@lifi/types';
import type { Address, TransactionRequest as ViemTxRequest, RpcTransactionRequest } from 'viem';

import { EvmEstimationDataWithFallback } from 'lib/temple/types';

import { toTokenSlug } from '../../../../../lib/assets';
import { EVM_TOKEN_SLUG } from '../../../../../lib/assets/defaults';
import { EVM_ZERO_ADDRESS } from '../../../../../lib/constants';

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
      gasPrice: parseGasPrice(tx.gasPrice)
    };
  }

  return null;
}

export function getTokenSlugFromLifiAddress(address: string) {
  return EVM_ZERO_ADDRESS === address ? EVM_TOKEN_SLUG : toTokenSlug(address, 0);
}

function parseGasPrice(gasPrice: string | number): bigint {
  if (typeof gasPrice === 'string' && gasPrice.startsWith('0x')) {
    return BigInt(gasPrice);
  }
  const gweiNumber = Number(gasPrice);
  if (isNaN(gweiNumber) || gweiNumber < 0) {
    throw new Error(`Invalid gasPrice value: ${gasPrice}`);
  }
  return BigInt(Math.floor(gweiNumber * 1e9));
}
