import { useCallback } from 'react';

import { pick } from 'lodash';
import { parseEther } from 'viem';

import { toastError } from 'app/toaster';
import { useTypedSWR } from 'lib/swr';
import { getReadOnlyEvm } from 'temple/evm';
import { EvmChain } from 'temple/front';

export interface EvmEstimationData {
  estimatedFee: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  data: string;
  nonce: number;
}

export const useEvmEstimationData = (
  to: HexString,
  assetSlug: string,
  accountPkh: HexString,
  network: EvmChain,
  toFilled?: boolean,
  amount?: string
) => {
  const estimate = useCallback(async (): Promise<EvmEstimationData | undefined> => {
    try {
      const publicClient = getReadOnlyEvm(network.rpcBaseURL);

      const transaction = await publicClient.prepareTransactionRequest({
        chain: {
          id: network.chainId,
          name: network.name,
          nativeCurrency: network.currency,
          rpcUrls: {
            default: {
              http: [network.rpcBaseURL]
            }
          }
        },
        to,
        account: accountPkh,
        value: amount ? parseEther(amount) : BigInt(1)
      });

      return {
        estimatedFee: transaction.gas * transaction.maxFeePerGas,
        data: transaction.data || '0x',
        ...pick(transaction, ['gas', 'maxFeePerGas', 'maxPriorityFeePerGas', 'nonce'])
      };
    } catch (err: any) {
      console.warn(err);
      toastError(err.details || err.message);

      return undefined;
    }
  }, [network, accountPkh, to, amount]);

  return useTypedSWR(toFilled ? ['evm-estimation-data', network.chainId, assetSlug, accountPkh, to] : null, estimate, {
    shouldRetryOnError: false,
    focusThrottleInterval: 10_000,
    dedupingInterval: 10_000
  });
};
