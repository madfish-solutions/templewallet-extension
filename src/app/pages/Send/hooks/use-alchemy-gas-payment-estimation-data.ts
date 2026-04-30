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

import { ALCHEMY_GAS_PAYMENT_TOKEN_DECIMALS } from '../alchemy-pay-gas-with-token';
import { buildBasicEvmSendParams } from '../build-basic-evm-send-params';

interface UseAlchemyGasPaymentEstimationDataInput {
  to: HexString;
  sendAssetSlug: string;
  gasPaymentAssetSlug: string;
  accountPkh: HexString;
  network: EvmChain;
  amount: string;
  enabled: boolean;
}

export const useAlchemyGasPaymentEstimationData = ({
  to,
  sendAssetSlug,
  gasPaymentAssetSlug,
  accountPkh,
  network,
  amount,
  enabled
}: UseAlchemyGasPaymentEstimationDataInput) => {
  const sendAssetMetadata = useEvmCategorizedAssetMetadata(sendAssetSlug, network.chainId);
  const gasPaymentAssetMetadata = useEvmCategorizedAssetMetadata(gasPaymentAssetSlug, network.chainId);

  const estimate = useCallback(async () => {
    if (!sendAssetMetadata) {
      throw new Error('Asset metadata not found');
    }

    const { to: txDestination, value, data } = buildBasicEvmSendParams(accountPkh, to, sendAssetMetadata, amount);

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
  }, [accountPkh, amount, network.chainId, sendAssetMetadata, to]);

  const swr = useTypedSWR(
    enabled
      ? ['alchemy-gas-payment-estimation', network.chainId, sendAssetSlug, gasPaymentAssetSlug, accountPkh, to, amount]
      : null,
    estimate,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 10_000
    }
  );

  const feeAmount = useMemo(() => {
    if (!swr.data?.feePayment?.maxAmount) {
      return undefined;
    }

    return formatUnits(
      BigInt(swr.data.feePayment.maxAmount),
      gasPaymentAssetMetadata?.decimals ?? ALCHEMY_GAS_PAYMENT_TOKEN_DECIMALS
    );
  }, [gasPaymentAssetMetadata?.decimals, swr.data]);

  return {
    ...swr,
    feeAmount
  };
};
