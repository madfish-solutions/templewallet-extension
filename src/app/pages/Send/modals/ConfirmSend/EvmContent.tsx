import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { omit } from 'lodash';
import { FormProvider, useForm } from 'react-hook-form-v7';
import { useDebounce } from 'use-debounce';
import { formatEther, parseEther, serializeTransaction } from 'viem';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { EvmReviewData } from 'app/pages/Send/form/interfaces';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { toastError, toastSuccess } from 'app/toaster';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance, useEvmTokenBalance } from 'lib/balances/hooks';
import { useTempleClient } from 'lib/temple/front';
import { ZERO } from 'lib/utils/numbers';

import { buildBasicEvmSendParams } from '../../build-basic-evm-send-params';

import { BaseContent, Tab } from './BaseContent';
import { DEFAULT_INPUT_DEBOUNCE } from './contants';
import { useEvmEstimationDataState } from './context';
import { useEvmFeeOptions } from './hooks/use-evm-fee-options';
import { EvmTxParamsFormData, FeeOptionLabel } from './types';

interface EvmContentProps {
  data: EvmReviewData;
  onClose: EmptyFn;
}

export const EvmContent: FC<EvmContentProps> = ({ data, onClose }) => {
  const { account, network, assetSlug, to, amount, onConfirm } = data;

  const accountPkh = account.address as HexString;

  const { sendEvmTransaction } = useTempleClient();

  const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, accountPkh, network);
  const { value: ethBalance = ZERO } = useEvmTokenBalance(EVM_TOKEN_SLUG, accountPkh, network);
  const tokenMetadata = useEvmTokenMetadataSelector(network.chainId, assetSlug);
  const collectibleMetadata = useEvmCollectibleMetadataSelector(network.chainId, assetSlug);

  const form = useForm<EvmTxParamsFormData>({ mode: 'onChange' });
  const { watch, formState, setValue } = form;

  const gasPriceValue = watch('gasPrice');

  const [debouncedNonce] = useDebounce(watch('nonce'), DEFAULT_INPUT_DEBOUNCE);
  const [debouncedGasLimit] = useDebounce(watch('gasLimit'), DEFAULT_INPUT_DEBOUNCE);
  const [debouncedGasPrice] = useDebounce(gasPriceValue, DEFAULT_INPUT_DEBOUNCE);

  const [tab, setTab] = useState<Tab>('details');
  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | nullish>('mid');
  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const { data: estimationData } = useEvmEstimationData(
    to as HexString,
    assetSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    true,
    amount
  );

  const feeOptions = useEvmFeeOptions(debouncedGasLimit, estimationData);
  const { setData } = useEvmEstimationDataState();

  useEffect(() => {
    if (estimationData && feeOptions) setData({ ...estimationData, feeOptions });
  }, [estimationData, feeOptions, setData]);

  useEffect(() => {
    if (gasPriceValue && selectedFeeOption) setSelectedFeeOption(null);
  }, [gasPriceValue, selectedFeeOption]);

  const rawTransaction = useMemo(() => {
    if (!estimationData || !feeOptions) return null;

    const parsedGasPrice = debouncedGasPrice ? parseEther(debouncedGasPrice, 'gwei') : null;

    return serializeTransaction({
      chainId: network.chainId,
      gas: debouncedGasLimit ? BigInt(debouncedGasLimit) : estimationData.gas,
      nonce: debouncedNonce ? Number(debouncedNonce) : estimationData.nonce,
      to: to as HexString,
      value: parseEther(amount),
      ...(selectedFeeOption ? feeOptions.gasPrice[selectedFeeOption] : feeOptions.gasPrice.mid),
      ...(parsedGasPrice ? { maxFeePerGas: parsedGasPrice, maxPriorityFeePerGas: parsedGasPrice } : {})
    });
  }, [
    amount,
    debouncedGasLimit,
    debouncedGasPrice,
    debouncedNonce,
    estimationData,
    feeOptions,
    network.chainId,
    selectedFeeOption,
    to
  ]);

  useEffect(() => {
    if (rawTransaction) setValue('rawTransaction', rawTransaction);
  }, [rawTransaction, setValue]);

  const displayedFee = useMemo(() => {
    if (feeOptions && selectedFeeOption) return feeOptions.displayed[selectedFeeOption];

    if (estimationData && debouncedGasPrice) {
      const gas = debouncedGasLimit ? BigInt(debouncedGasLimit) : estimationData.gas;

      return formatEther(gas * parseEther(debouncedGasPrice, 'gwei'));
    }

    return '0';
  }, [feeOptions, selectedFeeOption, estimationData, debouncedGasPrice, debouncedGasLimit]);

  const handleFeeOptionSelect = useCallback(
    (label: FeeOptionLabel) => {
      setSelectedFeeOption(label);
      setValue('gasPrice', '', { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
      if (formState.isSubmitting) return;

      if (!estimationData || !feeOptions) {
        toastError('Failed to estimate transaction.');

        return;
      }

      try {
        const parsedGasPrice = gasPrice ? parseEther(gasPrice, 'gwei') : null;

        const { value, to: txDestination } = await buildBasicEvmSendParams(
          accountPkh,
          to as HexString,
          amount,
          tokenMetadata ?? collectibleMetadata
        );

        const txHash = await sendEvmTransaction(accountPkh, network, {
          to: txDestination,
          value,
          ...omit(estimationData, 'estimatedFee'),
          ...(selectedFeeOption ? feeOptions.gasPrice[selectedFeeOption] : feeOptions.gasPrice.mid),
          ...(parsedGasPrice ? { maxFeePerGas: parsedGasPrice, maxPriorityFeePerGas: parsedGasPrice } : {}),
          ...(gasLimit ? { gas: BigInt(gasLimit) } : {}),
          ...(nonce ? { nonce: Number(nonce) } : {})
        });

        onConfirm();
        onClose();

        setTimeout(() => toastSuccess('Transaction Submitted', true, txHash), CLOSE_ANIMATION_TIMEOUT * 2);
      } catch (err: any) {
        console.error(err);

        setLatestSubmitError(err.message);
        setTab('error');
      }
    },
    [
      accountPkh,
      amount,
      collectibleMetadata,
      estimationData,
      feeOptions,
      formState.isSubmitting,
      network,
      onClose,
      onConfirm,
      selectedFeeOption,
      sendEvmTransaction,
      to,
      tokenMetadata
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
