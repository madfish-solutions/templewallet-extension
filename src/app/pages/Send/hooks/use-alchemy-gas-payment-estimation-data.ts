import { useCallback, useMemo } from 'react';

import { formatUnits, numberToHex } from 'viem';

import {
  AlchemyPrepareCallsResult,
  getAlchemyFeePayment,
  prepareAlchemyWalletCalls
} from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { EvmChain } from 'temple/front';

import { buildBasicEvmSendParams } from '../build-basic-evm-send-params';

interface UseAlchemyGasPaymentEstimationDataInput {
  to: HexString;
  assetSlug: string;
  accountPkh: HexString;
  network: EvmChain;
  amount: string;
  enabled: boolean;
}

export const useAlchemyGasPaymentEstimationData = ({
  to,
  assetSlug,
  accountPkh,
  network,
  amount,
  enabled
}: UseAlchemyGasPaymentEstimationDataInput) => {
  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);

  const estimate = useCallback(async () => {
    if (!assetMetadata) {
      throw new Error('Asset metadata not found');
    }

    const { to: txDestination, value, data } = buildBasicEvmSendParams(accountPkh, to, assetMetadata, amount);

    const response = await prepareAlchemyWalletCalls<AlchemyPrepareCallsResult>({
      chainId: numberToHex(network.chainId),
      from: accountPkh,
      onlyEstimation: true,
      paymasterService: true,
      calls: [
        {
          to: txDestination,
          value: numberToHex(value),
          ...(data ? { data } : {})
        }
      ]
    });

    if (response?.error) {
      throw new Error(response.error.message);
    }

    if (!response?.result) {
      throw new Error('Alchemy prepare calls response is empty');
    }

    const feePayment = getAlchemyFeePayment(response?.result);

    if (!feePayment?.maxAmount) {
      throw new Error('Alchemy fee payment estimate is unavailable');
    }

    return { ...response.result, feePayment };
  }, [accountPkh, amount, assetMetadata, network.chainId, to]);

  const swr = useTypedSWR(
    enabled ? ['alchemy-gas-payment-estimation', network.chainId, assetSlug, accountPkh, to, amount] : null,
    estimate,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 10_000
    }
  );

  const feeAmount = useMemo(() => {
    if (!swr.data?.feePayment?.maxAmount || assetMetadata?.decimals == null) {
      return undefined;
    }

    return formatUnits(BigInt(swr.data.feePayment.maxAmount), assetMetadata.decimals);
  }, [assetMetadata?.decimals, swr.data]);

  return {
    ...swr,
    feeAmount
  };
};
