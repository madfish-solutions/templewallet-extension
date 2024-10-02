import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getRevealFee } from '@taquito/taquito';
import { FormProvider, useForm } from 'react-hook-form-v7';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { TezosReviewData } from 'app/pages/Send/form/interfaces';
import { toastError, toastSuccess } from 'app/toaster';
import { isTezAsset, toPenny } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { useTezosAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { mutezToTz } from 'lib/temple/helpers';
import { tezosManagerKeyHasManager } from 'lib/tezos';
import { ZERO } from 'lib/utils/numbers';
import { getTezosToolkitWithSigner } from 'temple/front';

import { estimateTezosMaxFee } from '../../form/utils';

import { BaseContent } from './BaseContent';
import { DisplayedFeeOptions, FeeOptionLabel, TezosTxParamsFormData } from './interfaces';

interface TezosContentProps {
  data: TezosReviewData;
  onClose: EmptyFn;
}

export const TezosContent: FC<TezosContentProps> = ({ data, onClose }) => {
  const { account, network, assetSlug, to, amount } = data;

  const accountPkh = account.address;

  const form = useForm<TezosTxParamsFormData>();
  const { watch, formState, setValue } = form;

  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | null>('mid');

  const assetMetadata = useTezosAssetMetadata(assetSlug, network.chainId);
  const { value: balance = ZERO } = useTezosAssetBalance(assetSlug, accountPkh, network);

  const tezos = getTezosToolkitWithSigner(network.rpcBaseURL, account.ownerAddress || accountPkh);

  const estimateBaseFee = useCallback(async () => {
    try {
      if (!assetMetadata) throw new Error('Metadata not found');

      const tez = isTezAsset(assetSlug);

      const [transferParams, manager] = await Promise.all([
        toTransferParams(tezos, assetSlug, assetMetadata, accountPkh, to, toPenny(assetMetadata)),
        tezos.rpc.getManagerKey(account.ownerAddress || accountPkh)
      ]);

      const estmtnMax = await estimateTezosMaxFee(account, tez, tezos, to, balance, transferParams, manager);

      let estimatedBaseFee = mutezToTz(estmtnMax.burnFeeMutez + estmtnMax.suggestedFeeMutez);
      if (!tezosManagerKeyHasManager(manager)) {
        estimatedBaseFee = estimatedBaseFee.plus(mutezToTz(getRevealFee(to)));
      }

      return estimatedBaseFee;
    } catch (err) {
      console.error(err);

      return undefined;
    }
  }, [assetSlug, accountPkh]);

  const { data: estimatedBaseFee } = useTypedSWR(
    () => ['tezos-transaction-fee', tezos.clientId, assetSlug, accountPkh, to],
    estimateBaseFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: TEZOS_BLOCK_DURATION
    }
  );

  const gasFeeValue = watch('gasFee');
  const StorageLimitValue = watch('storageLimit');

  const displayedFeeOptions = useMemo<DisplayedFeeOptions | undefined>(() => {
    if (!estimatedBaseFee) return;

    return {
      slow: estimatedBaseFee.plus(1e-4).toString(),
      mid: estimatedBaseFee.plus(1.5e-4).toString(),
      fast: estimatedBaseFee.plus(2e-4).toString()
    };
  }, [estimatedBaseFee]);

  const displayedFee = useMemo(() => {
    if (gasFeeValue) return gasFeeValue;

    if (displayedFeeOptions && selectedFeeOption) return displayedFeeOptions[selectedFeeOption];

    return;
  }, [selectedFeeOption, gasFeeValue, displayedFeeOptions]);

  useEffect(() => {
    if (gasFeeValue && selectedFeeOption) setSelectedFeeOption(null);
  }, [gasFeeValue, selectedFeeOption]);

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

      if (!estimatedBaseFee) {
        toastError('Failed to estimate transaction.');

        return;
      }

      try {
        onClose();

        // if (isTezosContractAddress(accountPkh)) {
        //   const michelsonLambda = isTezosContractAddress(toResolved) ? transferToContract : transferImplicit;
        //
        //   const contract = await loadContract(tezos, accountPkh);
        //   await contract.methodsObject.do(michelsonLambda(toResolved, tzToMutez(amount))).send({ amount: 0 });
        // } else {
        //   const actualAmount = shouldUseFiat ? toAssetAmount(amount) : amount;
        //   const transferParams = await toTransferParams(
        //     tezos,
        //     assetSlug,
        //     assetMetadata,
        //     accountPkh,
        //     toResolved,
        //     actualAmount
        //   );
        //   const estmtn = await tezos.estimate.transfer(transferParams);
        //   const fee = estmtn.suggestedFeeMutez;
        //   await tezos.wallet.transfer({ ...transferParams, fee }).send();
        // }

        setTimeout(() => toastSuccess('Transaction Submitted. Hash: ', true, 'txHash'), CLOSE_ANIMATION_TIMEOUT * 2);
      } catch (err: any) {
        console.log(err);

        toastError(err.message);
      }
    },
    [estimatedBaseFee, formState.isSubmitting, onClose]
  );

  return (
    <FormProvider {...form}>
      <BaseContent<TezosTxParamsFormData>
        network={network}
        assetSlug={assetSlug}
        amount={amount}
        recipientAddress={to}
        displayedFeeOptions={displayedFeeOptions}
        displayedFee={displayedFee}
        displayedStorageLimit={StorageLimitValue || '0'}
        onFeeOptionSelect={handleFeeOptionSelect}
        selectedFeeOption={selectedFeeOption}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
