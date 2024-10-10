import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { TransactionOperation, TransactionWalletOperation } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { FormProvider, useForm } from 'react-hook-form-v7';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { TezosReviewData } from 'app/pages/Send/form/interfaces';
import { useTezosEstimationData } from 'app/pages/Send/hooks/use-tezos-estimation-data';
import { toastError, toastSuccess } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useTezosAssetMetadata } from 'lib/metadata';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { loadContract } from 'lib/temple/contract';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { isTezosContractAddress } from 'lib/tezos';
import { ZERO } from 'lib/utils/numbers';
import { getTezosToolkitWithSigner } from 'temple/front';

import { BaseContent, Tab } from './BaseContent';
import { useTezosEstimationDataState } from './context';
import { DisplayedFeeOptions, FeeOptionLabel, TezosTxParamsFormData } from './interfaces';
import { getTezosFeeOption } from './utils';

interface TezosContentProps {
  data: TezosReviewData;
  onClose: EmptyFn;
}

export const TezosContent: FC<TezosContentProps> = ({ data, onClose }) => {
  const { account, network, assetSlug, to, amount } = data;

  const accountPkh = account.address;

  const form = useForm<TezosTxParamsFormData>({ mode: 'onChange' });
  const { watch, formState, setValue } = form;

  const gasFeeValue = watch('gasFee');
  const storageLimitValue = watch('storageLimit');

  const [tab, setTab] = useState<Tab>('details');
  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | null>('mid');
  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const assetMetadata = useTezosAssetMetadata(assetSlug, network.chainId);

  const { value: balance = ZERO } = useTezosAssetBalance(assetSlug, accountPkh, network);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const tezos = getTezosToolkitWithSigner(network.rpcBaseURL, account.ownerAddress || accountPkh, true);

  const { data: estimationData } = useTezosEstimationData(
    to,
    tezos,
    network.chainId,
    account,
    accountPkh,
    assetSlug,
    balance,
    tezBalance,
    assetMetadata,
    true
  );

  const { setData } = useTezosEstimationDataState();

  useEffect(() => {
    if (estimationData) setData(estimationData);
  }, [estimationData, setData]);

  const displayedFeeOptions = useMemo<DisplayedFeeOptions | undefined>(() => {
    const baseFee = estimationData?.baseFee;

    if (!(baseFee instanceof BigNumber)) return;

    return {
      slow: getTezosFeeOption('slow', baseFee),
      mid: getTezosFeeOption('mid', baseFee),
      fast: getTezosFeeOption('fast', baseFee)
    };
  }, [estimationData]);

  const displayedFee = useMemo(() => {
    if (gasFeeValue) return gasFeeValue;

    if (displayedFeeOptions && selectedFeeOption) return displayedFeeOptions[selectedFeeOption];

    return;
  }, [selectedFeeOption, gasFeeValue, displayedFeeOptions]);

  const displayedStorageLimit = useMemo(() => {
    if (!estimationData) return;

    const estimates = estimationData.estimates;

    const storageLimit = storageLimitValue || estimates.storageLimit;
    // @ts-expect-error
    const minimalFeePerStorageByteMutez = estimates.minimalFeePerStorageByteMutez;

    return mutezToTz(new BigNumber(storageLimit).times(minimalFeePerStorageByteMutez)).toString();
  }, [estimationData, storageLimitValue]);

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

      if (!estimationData) {
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
              storageLimit: storageLimit ? Number(storageLimit) : estmtn.storageLimit
            })
            .send();
        }

        onClose();

        // @ts-expect-error
        const txHash = operation.hash || operation.opHash;

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
      assetMetadata,
      assetSlug,
      displayedFeeOptions,
      estimationData,
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
        selectedTab={tab}
        setSelectedTab={setTab}
        latestSubmitError={latestSubmitError}
        displayedStorageLimit={displayedStorageLimit}
        onFeeOptionSelect={handleFeeOptionSelect}
        selectedFeeOption={selectedFeeOption}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
