import { FeeValues, FeeValuesEIP1559, FeeValuesLegacy, TransactionRequest } from 'viem';

import { EvmNetworkEssentials } from '../networks';

import { SerializedBigints, toBigintRecord } from './utils';

import { getViemPublicClient } from '.';

interface EvmEstimationDataBase {
  estimatedFee: bigint;
  data: HexString;
  type: NonNullable<TransactionRequest['type']>;
  gas: bigint;
  nonce: number;
}

interface LegacyEvmEstimationData extends EvmEstimationDataBase, FeeValuesLegacy {
  type: 'legacy' | 'eip2930';
}

type SerializedLegacyEvmEstimationData = SerializedBigints<LegacyEvmEstimationData>;

interface Eip1559EvmEstimationData extends EvmEstimationDataBase, FeeValuesEIP1559 {
  type: 'eip1559' | 'eip7702';
}

type SerializedEip1559EvmEstimationData = SerializedBigints<Eip1559EvmEstimationData>;

export type EvmEstimationData = LegacyEvmEstimationData | Eip1559EvmEstimationData;

export type SerializedEvmEstimationData = SerializedLegacyEvmEstimationData | SerializedEip1559EvmEstimationData;

export const deserializeEstimationData = (data: SerializedEvmEstimationData) => {
  const { estimatedFee, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, ...restProps } = data;

  return {
    ...restProps,
    ...toBigintRecord({ estimatedFee, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas })
  } as EvmEstimationData;
};

function getEstimatedFee(fees: FeeValues & { gas: bigint }): bigint;
function getEstimatedFee(fees: Partial<FeeValues & { gas: bigint }>): bigint | undefined;
function getEstimatedFee(fees: Partial<FeeValues & { gas: bigint }>): bigint | undefined {
  const gasPrice = fees.gasPrice ?? fees.maxFeePerGas;

  return fees.gas !== undefined && gasPrice !== undefined ? fees.gas * gasPrice : undefined;
}

export const estimate = async (network: EvmNetworkEssentials, req: TransactionRequest): Promise<EvmEstimationData> => {
  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas, from, ...restReqProps } = req;
  const publicClient = getViemPublicClient(network);

  const transaction = await publicClient.prepareTransactionRequest({ account: from, ...restReqProps });

  const commonProps = {
    estimatedFee: getEstimatedFee(transaction),
    data: transaction.data || '0x',
    gas: transaction.gas,
    nonce: transaction.nonce
  };

  switch (transaction.type) {
    case 'legacy':
    case 'eip2930':
      return {
        ...commonProps,
        type: transaction.type,
        gasPrice: transaction.gasPrice
      };
    case 'eip1559':
    case 'eip7702':
      return {
        ...commonProps,
        type: transaction.type,
        maxFeePerGas: transaction.maxFeePerGas,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
      };
    default:
      throw new Error('Unsupported transaction type');
  }
};

// TODO: use this for nonce on confirtmation Swap modal?
export async function getNonceUsingEstimate(
  network: EvmNetworkEssentials,
  fromAddress: string
): Promise<number | undefined> {
  const genericReq: TransactionRequest = {
    from: fromAddress as HexString,
    to: fromAddress as HexString,
    value: BigInt(0),
    data: '0x',
    gas: BigInt(21000),
    type: 'legacy'
  };

  try {
    const estimationData = await estimate(network, genericReq);
    return estimationData.nonce;
  } catch (error) {
    console.error('Error getting nonce using estimate:', error);
    return undefined;
  }
}
