import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form-v7';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { TezosReviewData } from 'app/pages/Send/form/interfaces';
import { toastError, toastSuccess } from 'app/toaster';
import { useTypedSWR } from 'lib/swr';

import { BaseContent } from './BaseContent';
import { FeeOptionLabel, TezosTxParamsFormData } from './interfaces';

interface TezosContentProps {
  data: TezosReviewData;
  onClose: EmptyFn;
}

export const TezosContent: FC<TezosContentProps> = ({ data, onClose }) => {
  const { network, accountPkh, assetSlug, to, amount } = data;

  const form = useForm<TezosTxParamsFormData>();
  const { watch, formState, setValue } = form;

  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | null>('mid');

  const estimateFee = useCallback(async () => {
    try {
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

  const gasFeeValue = watch('gasFee');

  const displayedFee = useMemo(() => {
    return undefined;
  }, [estimationData, selectedFeeOption]);

  useEffect(() => {
    if (gasFeeValue) setSelectedFeeOption(null);
    if (selectedFeeOption) setValue('gasFee', '');
  }, [gasFeeValue, selectedFeeOption, setValue]);

  const handleFeeOptionSelect = useCallback(
    (label: FeeOptionLabel) => {
      setSelectedFeeOption(label);
      setValue('gasFee', '');
    },
    [setValue]
  );

  const onSubmit = useCallback(
    async ({ gasFee, storageLimit }: TezosTxParamsFormData) => {
      if (formState.isSubmitting) return;

      if (!estimationData) {
        toastError('Failed to estimate transaction.');

        return;
      }

      try {
        onClose();

        setTimeout(() => toastSuccess('Transaction Submitted. Hash: ', true, 'txHash'), CLOSE_ANIMATION_TIMEOUT * 2);
      } catch (err: any) {
        console.log(err);

        toastError(err.message);
      }
    },
    [estimationData, formState.isSubmitting, onClose]
  );

  return (
    <FormProvider {...form}>
      <BaseContent<TezosTxParamsFormData>
        network={network}
        assetSlug={assetSlug}
        amount={amount}
        recipientAddress={to}
        displayedFee={displayedFee}
        onFeeOptionSelect={handleFeeOptionSelect}
        selectedFeeOption={selectedFeeOption}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
