import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { omit } from 'lodash';
import { FormProvider, useForm } from 'react-hook-form-v7';
import { formatEther, parseEther } from 'viem';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { EvmReviewData } from 'app/pages/Send/form/interfaces';
import { toastError, toastSuccess } from 'app/toaster';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { getReadOnlyEvm } from 'temple/evm';

import { BaseContent } from './BaseContent';
import { useEvmFeeOptions } from './hooks/use-evm-fee-options';
import { EvmEstimationData, EvmTxParamsFormData, FeeOptionLabel } from './interfaces';

interface EvmContentProps {
  data: EvmReviewData;
  onClose: EmptyFn;
}

export const EvmContent: FC<EvmContentProps> = ({ data, onClose }) => {
  const { accountPkh, network, assetSlug, to, amount } = data;

  const { sendEvmTransaction } = useTempleClient();

  const form = useForm<EvmTxParamsFormData>();
  const { watch, formState, setValue } = form;

  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | nullish>('mid');

  const estimateFee = useCallback(async (): Promise<EvmEstimationData | undefined> => {
    try {
      const publicClient = getReadOnlyEvm(network.rpcBaseURL);
      let gas = BigInt(0);

      if (isEvmNativeTokenSlug(assetSlug)) {
        gas = await publicClient.estimateGas({
          account: accountPkh,
          to: to as HexString,
          value: parseEther(amount)
        });
      }

      const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();

      return { estimatedFee: gas * maxFeePerGas, gas, maxFeePerGas, maxPriorityFeePerGas };
    } catch (err) {
      console.warn(err);

      return undefined;
    }
  }, [accountPkh, assetSlug, amount, to, network.rpcBaseURL]);

  const { data: estimationData } = useTypedSWR(
    ['evm-transaction-fee', network.chainId, assetSlug, accountPkh, to],
    estimateFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 10_000
    }
  );

  const feeOptions = useEvmFeeOptions(estimationData);

  const gasPriceValue = watch('gasPrice');

  const displayedFee = useMemo(() => {
    if (gasPriceValue && estimationData) {
      return formatEther(estimationData.gas * parseEther(gasPriceValue, 'gwei'));
    }

    if (feeOptions && selectedFeeOption) return feeOptions.displayed[selectedFeeOption];

    return;
  }, [feeOptions, estimationData, gasPriceValue, selectedFeeOption]);

  useEffect(() => {
    if (gasPriceValue && selectedFeeOption) setSelectedFeeOption(null);
  }, [gasPriceValue, selectedFeeOption]);

  const handleFeeOptionSelect = useCallback(
    (label: FeeOptionLabel) => {
      setSelectedFeeOption(label);
      setValue('gasPrice', '');
    },
    [setValue]
  );

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
      if (formState.isSubmitting) return;

      if (!estimationData) {
        toastError('Failed to estimate transaction.');

        return;
      }

      try {
        const parsedGasPrice = gasPrice ? parseEther(gasPrice, 'gwei') : null;

        const txHash = await sendEvmTransaction(accountPkh, network, {
          to: to as HexString,
          value: parseEther(amount),
          ...omit(estimationData, 'estimatedFee'),
          ...(feeOptions && selectedFeeOption ? feeOptions.gasPrice[selectedFeeOption] : {}),
          ...(parsedGasPrice ? { maxFeePerGas: parsedGasPrice, maxPriorityFeePerGas: parsedGasPrice } : {}),
          ...(gasLimit ? { gas: BigInt(gasLimit) } : {}),
          ...(nonce ? { nonce: Number(nonce) } : {})
        });

        onClose();

        setTimeout(() => toastSuccess('Transaction Submitted. Hash: ', true, txHash), CLOSE_ANIMATION_TIMEOUT * 2);
      } catch (err: any) {
        console.log(err);

        toastError(err.message);
      }
    },
    [
      accountPkh,
      amount,
      estimationData,
      feeOptions,
      formState.isSubmitting,
      network,
      onClose,
      selectedFeeOption,
      sendEvmTransaction,
      to
    ]
  );

  return (
    <FormProvider {...form}>
      <BaseContent<EvmTxParamsFormData>
        network={network}
        assetSlug={assetSlug}
        amount={amount}
        recipientAddress={to}
        displayedFeeOptions={feeOptions?.displayed}
        selectedFeeOption={selectedFeeOption}
        displayedFee={displayedFee}
        onFeeOptionSelect={handleFeeOptionSelect}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
