import { useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { pick } from 'lodash';
import { parseEther } from 'viem';

import { toastError } from 'app/toaster';
import { isNativeTokenAddress } from 'lib/apis/temple/endpoints/evm/api.utils';
import { useTypedSWR } from 'lib/swr';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front';

import { checkZeroBalance } from './utils';

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
  balance: BigNumber,
  ethBalance: BigNumber,
  toFilled?: boolean,
  amount?: string
) => {
  const estimate = useCallback(async (): Promise<EvmEstimationData | undefined> => {
    try {
      const isNativeToken = isNativeTokenAddress(network.chainId, assetSlug);

      checkZeroBalance(balance, ethBalance, isNativeToken);

      const publicClient = getReadOnlyEvmForNetwork(network);

      const transaction = await publicClient.prepareTransactionRequest({
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
  }, [network, assetSlug, balance, ethBalance, to, accountPkh, amount]);

  return useTypedSWR(
    toFilled ? ['evm-estimation-data', network.chainId, assetSlug, accountPkh, to, amount] : null,
    estimate,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 10_000
    }
  );
};
