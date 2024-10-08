import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getRevealFee, TransactionOperation, TransactionWalletOperation } from '@taquito/taquito';
import { FormProvider, useForm } from 'react-hook-form-v7';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { TezosReviewData } from 'app/pages/Send/form/interfaces';
import { toastError, toastSuccess } from 'app/toaster';
import { isTezAsset, toPenny } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { useTezosAssetMetadata } from 'lib/metadata';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { useTypedSWR } from 'lib/swr';
import { loadContract } from 'lib/temple/contract';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { isTezosContractAddress, tezosManagerKeyHasManager } from 'lib/tezos';
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

  const tezos = getTezosToolkitWithSigner(network.rpcBaseURL, account.ownerAddress || accountPkh, true);

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
  }, [assetMetadata, assetSlug, tezos, accountPkh, to, account, balance]);

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
        if (!assetMetadata) throw new Error('Metadata not found');

        let operation: TransactionWalletOperation | TransactionOperation;

        if (isTezosContractAddress(accountPkh)) {
          const michelsonLambda = isTezosContractAddress(to) ? transferToContract : transferImplicit;

          const contract = await loadContract(tezos, accountPkh);
          operation = await contract.methodsObject.do(michelsonLambda(to, tzToMutez(amount))).send({ amount: 0 });
        } else {
          const transferParams = await toTransferParams(tezos, assetSlug, assetMetadata, accountPkh, to, amount);
          const estmtn = await tezos.estimate.transfer(transferParams);
          operation = await tezos.wallet
            .transfer({
              ...transferParams,
              fee: tzToMutez(
                displayedFeeOptions && selectedFeeOption ? displayedFeeOptions[selectedFeeOption] : gasFee
              ).toNumber(),
              storageLimit: storageLimit ? tzToMutez(storageLimit).toNumber() : estmtn.storageLimit
            })
            .send();
        }

        onClose();

        // @ts-expect-error
        const txHash = operation.hash || operation.opHash;

        setTimeout(() => toastSuccess('Transaction Submitted', true, txHash), CLOSE_ANIMATION_TIMEOUT * 2);
      } catch (err: any) {
        console.log(err);

        toastError(err.message);
      }
    },
    [
      accountPkh,
      amount,
      assetMetadata,
      assetSlug,
      displayedFeeOptions,
      estimatedBaseFee,
      formState.isSubmitting,
      onClose,
      selectedFeeOption,
      tezos,
      to
    ]
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
