import BigNumber from 'bignumber.js';

import { toastError } from 'app/toaster';
import { useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { getViemPublicClient } from 'temple/evm';
import { assertEvmTransactionBalance } from 'temple/evm/assert-transaction-balance';
import { EvmEstimationData, estimate as genericEstimate } from 'temple/evm/estimate';
import { EvmChain } from 'temple/front';

import { buildBasicEvmSendParams } from '../build-basic-evm-send-params';

interface EvmEstimationInput {
  to: HexString;
  assetSlug: string;
  accountPkh: HexString;
  network: EvmChain;
  balance: BigNumber;
  ethBalance: BigNumber;
  toFilled?: boolean;
  amount?: string;
  silent?: boolean;
  paused?: boolean;
}

export const useEvmEstimationData = ({
  to,
  assetSlug,
  accountPkh,
  network,
  toFilled,
  amount,
  silent,
  paused = false
}: EvmEstimationInput) => {
  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);

  const estimate = async (): Promise<EvmEstimationData> => {
    try {
      if (!assetMetadata) {
        throw new Error('Asset metadata not found');
      }

      const transaction = buildBasicEvmSendParams(accountPkh, to, assetMetadata, amount);
      const estimation = await genericEstimate(network, {
        ...transaction,
        from: accountPkh
      });
      await assertEvmTransactionBalance(getViemPublicClient(network), accountPkh, { ...transaction, ...estimation });

      return estimation;
    } catch (err: any) {
      console.warn(err);
      if (!silent) {
        toastError(err.details || err.message);
      }

      throw err;
    }
  };

  return useTypedSWR(
    toFilled ? ['evm-estimation-data', network.chainId, assetSlug, accountPkh, to, amount] : null,
    estimate,
    {
      shouldRetryOnError: false,
      isPaused: () => paused,
      focusThrottleInterval: 10_000,
      dedupingInterval: 10_000
    }
  );
};
