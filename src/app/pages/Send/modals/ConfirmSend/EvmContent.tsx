import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { omit } from 'lodash';
import { FormProvider, useForm } from 'react-hook-form-v7';
import { formatEther, parseEther, serializeTransaction } from 'viem';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { EvmReviewData } from 'app/pages/Send/form/interfaces';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { toastError, toastSuccess } from 'app/toaster';
import { useTempleClient } from 'lib/temple/front';

import { BaseContent, Tab } from './BaseContent';
import { useEvmEstimationDataState } from './context';
import { useEvmFeeOptions } from './hooks/use-evm-fee-options';
import { EvmTxParamsFormData, FeeOptionLabel } from './interfaces';

interface EvmContentProps {
  data: EvmReviewData;
  onClose: EmptyFn;
}

export const EvmContent: FC<EvmContentProps> = ({ data, onClose }) => {
  const { account, network, assetSlug, to, amount } = data;

  const accountPkh = account.address as HexString;

  const { sendEvmTransaction } = useTempleClient();

  const form = useForm<EvmTxParamsFormData>({ mode: 'onChange' });
  const { watch, formState, setValue } = form;

  const gasPriceValue = watch('gasPrice');
  const gasLimitValue = watch('gasLimit');
  const nonceValue = watch('nonce');

  const [tab, setTab] = useState<Tab>('details');
  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | nullish>('mid');
  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const { data: estimationData } = useEvmEstimationData(to as HexString, assetSlug, accountPkh, network, true, amount);

  const feeOptions = useEvmFeeOptions(gasLimitValue, estimationData);
  const { setData } = useEvmEstimationDataState();

  useEffect(() => {
    if (estimationData && feeOptions) setData({ ...estimationData, feeOptions });
  }, [estimationData, feeOptions, setData]);

  useEffect(() => {
    if (gasPriceValue && selectedFeeOption) setSelectedFeeOption(null);
  }, [gasPriceValue, selectedFeeOption]);

  const rawTransaction = useMemo(() => {
    if (!estimationData || !feeOptions) return null;

    const parsedGasPrice = gasPriceValue ? parseEther(gasPriceValue, 'gwei') : null;

    return serializeTransaction({
      chainId: network.chainId,
      gas: gasLimitValue ? BigInt(gasLimitValue) : estimationData.gas,
      nonce: nonceValue ? Number(nonceValue) : estimationData.nonce,
      to: to as HexString,
      value: parseEther(amount),
      ...(selectedFeeOption ? feeOptions.gasPrice[selectedFeeOption] : feeOptions.gasPrice.mid),
      ...(parsedGasPrice ? { maxFeePerGas: parsedGasPrice, maxPriorityFeePerGas: parsedGasPrice } : {})
    });
  }, [
    amount,
    estimationData,
    feeOptions,
    gasLimitValue,
    gasPriceValue,
    network.chainId,
    nonceValue,
    selectedFeeOption,
    to
  ]);

  useEffect(() => {
    if (rawTransaction) setValue('rawTransaction', rawTransaction);
  }, [rawTransaction, setValue]);

  const displayedFee = useMemo(() => {
    if (feeOptions && selectedFeeOption) return feeOptions.displayed[selectedFeeOption];

    if (estimationData && gasPriceValue) {
      const gas = gasLimitValue ? BigInt(gasLimitValue) : estimationData.gas;

      return formatEther(gas * parseEther(gasPriceValue, 'gwei'));
    }

    return '0';
  }, [feeOptions, selectedFeeOption, estimationData, gasLimitValue, gasPriceValue]);

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

        setTimeout(() => toastSuccess('Transaction Submitted', true, txHash), CLOSE_ANIMATION_TIMEOUT * 2);
      } catch (err: any) {
        console.log(err);

        setLatestSubmitError(err.message);
        setTab('error');
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
        selectedTab={tab}
        setSelectedTab={setTab}
        selectedFeeOption={selectedFeeOption}
        latestSubmitError={latestSubmitError}
        displayedFee={displayedFee}
        onFeeOptionSelect={handleFeeOptionSelect}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
