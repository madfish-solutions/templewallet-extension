import { useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { pick } from 'lodash';

import { toastError } from 'app/toaster';
import { isNativeTokenAddress } from 'lib/apis/temple/endpoints/evm/api.utils';
import { useEvmAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front';

import { buildBasicEvmSendParams } from '../build-basic-evm-send-params';

import { checkZeroBalance } from './utils';

export interface EvmEstimationData {
  estimatedFee: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  data: HexString;
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
  const assetMetadata = useEvmAssetMetadata(network.chainId, assetSlug);

  const estimate = useCallback(async (): Promise<EvmEstimationData | undefined> => {
    try {
      if (!assetMetadata) {
        throw new Error('Asset metadata not found');
      }

      const isNativeToken = isNativeTokenAddress(network.chainId, assetSlug);

      checkZeroBalance(balance, ethBalance, isNativeToken);

      const publicClient = getReadOnlyEvmForNetwork(network);

      const transaction = await publicClient.prepareTransactionRequest({
        ...buildBasicEvmSendParams(accountPkh, to, assetMetadata, amount),
        account: accountPkh
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
  }, [network, assetSlug, balance, ethBalance, accountPkh, to, amount, assetMetadata]);

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
