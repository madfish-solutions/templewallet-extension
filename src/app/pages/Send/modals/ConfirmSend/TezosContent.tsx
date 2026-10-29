import React, { FC, ReactNode, useEffect, useState } from 'react';

import { OpKind, TransferParams, WalletParamsWithKind } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { FormProvider, useFormState } from 'react-hook-form';

import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { useTezosGasOnRamp } from 'app/hooks/use-tezos-gas-on-ramp';
import { TezosReviewData } from 'app/pages/Send/form/interfaces';
import { dispatch } from 'app/store';
import {
  addPendingTezosTransactionAction,
  monitorPendingTezosTransactionsAction
} from 'app/store/tezos/pending-transactions/actions';
import { TezosTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useTezosEstimationForm } from 'app/templates/TransactionTabs/use-tezos-estimation-form';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useCategorizedTezosAssetMetadata } from 'lib/metadata';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { useTypedSWR } from 'lib/swr';
import { loadContract } from 'lib/temple/contract';
import { TezosEstimationData } from 'lib/temple/front/estimation-data-providers';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { isTezosContractAddress } from 'lib/tezos';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { useUpdatableRef } from 'lib/ui/hooks';
import { useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { getTezosToolkitWithSigner, useTezosNetworkTiming } from 'temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { BaseContent } from './BaseContent';
import { TxData } from './types';

interface TezosContentProps {
  data: TezosReviewData;
  onSuccess: (txData: TxData<TempleChainKind.Tezos>) => void;
  onClose: EmptyFn;
  detailsContent?: ReactNode;
  suppressSubmitToast?: boolean;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export const TezosContent: FC<TezosContentProps> = ({
  data,
  onClose,
  onSuccess,
  detailsContent,
  suppressSubmitToast,
  onSubmittingChange
}) => {
  const { account, network, assetSlug, to, amount, onConfirm } = data;
  const { rpcBaseURL, chainId } = network;

  const assetMetadata = useCategorizedTezosAssetMetadata(assetSlug, network.chainId);

  if (!assetMetadata) throw new Error('Metadata not found');

  const accountPkh = account.address;
  const sourcePkh = account.ownerAddress || accountPkh;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);

  const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();
  const tezos = getTezosToolkitWithSigner(network, sourcePkh, true);
  const { blockDurationMs } = useTezosNetworkTiming(network);

  const getBasicSendParams = async (): Promise<WalletParamsWithKind[]> => {
    let transferParams: TransferParams;

    if (isTezosContractAddress(accountPkh)) {
      const michelsonLambda = isTezosContractAddress(to) ? transferToContract : transferImplicit;

      const contract = await loadContract(tezos, accountPkh);
      transferParams = contract.methodsObject.do(michelsonLambda(to, tzToMutez(amount))).toTransferParams();
    } else {
      transferParams = await toTransferParams(tezos, assetSlug, assetMetadata, accountPkh, to, amount);
    }

    return [
      {
        kind: OpKind.TRANSACTION,
        ...transferParams
      }
    ];
  };

  const { data: basicSendParams, error: basicParamsError } = useTypedSWR(
    ['tezos-basic-send-params', accountPkh, amount, assetSlug, to, rpcBaseURL, account.ownerAddress],
    getBasicSendParams,
    { shouldRetryOnError: false }
  );

  const estimate = async (): Promise<TezosEstimationData> => {
    if (!basicSendParams) throw new Error('Transfer parameters are unavailable');

    const estimates = await tezos.estimate.batch(basicSendParams.map(params => ({ ...params, source: sourcePkh })));

    return {
      estimates: estimates.map(serializeEstimate),
      baseFee: mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez + est.burnFeeMutez))),
      gasFee: mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez))),
      revealFee: mutezToTz(estimates.length > basicSendParams.length ? estimates[0].suggestedFeeMutez : 0)
    };
  };
  const {
    data: estimationData,
    error: estimationError,
    isLoading: estimationDataLoading,
    mutate: revalidateEstimation
  } = useTypedSWR(
    basicSendParams ? ['tezos-send-estimation-data', chainId, sourcePkh, rpcBaseURL, basicSendParams] : null,
    estimate,
    { shouldRetryOnError: false, focusThrottleInterval: 10_000, dedupingInterval: blockDurationMs }
  );

  const {
    form,
    tab,
    setTab,
    selectedFeeOption,
    handleFeeOptionSelect,
    submitOperation,
    displayedFeeOptions,
    displayedFee,
    displayedStorageFee,
    simulationError,
    assertCustomGasFeeNotTooLow
  } = useTezosEstimationForm({
    estimationData,
    basicParams: basicSendParams,
    senderAccount: account,
    network,
    estimationDataLoading,
    simulateOperation: true
  });
  const { isSubmitting } = useFormState({ control: form.control });
  const confirmationEstimationError = basicParamsError || estimationError || simulationError;
  useTezosGasOnRamp(chainId, sourcePkh, latestSubmitError || confirmationEstimationError);

  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();
  const { guard, ledgerPromptProps } = useLedgerWebHidFullViewGuard();

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const latestEstimationErrorRef = useUpdatableRef<unknown>(estimationError);

  const onSubmitError = (err: unknown) => {
    console.error(err);
    setLatestSubmitError(err);
    setTab('error');
  };

  const onSubmit = async ({ gasFee, storageLimit }: TezosTxParamsFormData) => {
    try {
      if (isSubmitting) return;

      try {
        assertCustomGasFeeNotTooLow(gasFee);
      } catch (e) {
        onSubmitError(e);

        return;
      }

      if (!estimationData || estimationError) {
        await revalidateEstimation();

        const freshEstimationError = latestEstimationErrorRef.current;

        if (freshEstimationError) {
          onSubmitError(freshEstimationError);
        } else {
          setLatestSubmitError(null);
          setTab('details');
        }

        return;
      }

      const doOperation = async () => {
        const result = await submitOperation(
          tezos,
          gasFee,
          storageLimit,
          estimationData.revealFee,
          displayedFeeOptions
        );
        if (!result) return;

        const { operation, startingBlockLevel } = result;
        const txHash = operation.opHash;

        onSuccess({ txHash, displayedFee, displayedStorageFee });
        onConfirm();

        const blockExplorer = getActiveBlockExplorer(network.chainId);

        dispatch(
          addPendingTezosTransactionAction({
            txHash,
            startingBlockLevel,
            accountPkh,
            network,
            blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.Tezos),
            submittedAt: Date.now(),
            kind: 'transfer',
            silent: suppressSubmitToast
          })
        );
        dispatch(monitorPendingTezosTransactionsAction());

        if (!suppressSubmitToast) {
          showTxSubmitToastWithDelay(TempleChainKind.Tezos, txHash, blockExplorer.url);
        }
      };

      if (isLedgerAccount) {
        const redirected = await guard(account.type);
        if (redirected) return;
        await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
      } else {
        await doOperation();
      }
    } catch (err: any) {
      onSubmitError(err);
    }
  };

  return (
    <>
      <FormProvider {...form}>
        <BaseContent<TezosTxParamsFormData>
          ledgerApprovalModalState={ledgerApprovalModalState}
          onLedgerModalClose={handleLedgerModalClose}
          network={network}
          assetSlug={assetSlug}
          nativeAssetSlug={TEZ_TOKEN_SLUG}
          amount={amount}
          recipientAddress={to}
          decimals={assetMetadata.decimals}
          displayedFeeOptions={displayedFeeOptions}
          displayedFee={displayedFee}
          submitDisabled={!basicSendParams}
          selectedTab={tab}
          setSelectedTab={setTab}
          latestSubmitError={latestSubmitError}
          estimationError={confirmationEstimationError}
          displayedStorageFee={displayedStorageFee}
          onFeeOptionSelect={handleFeeOptionSelect}
          selectedFeeOption={selectedFeeOption}
          onCancel={onClose}
          onSubmit={onSubmit}
          detailsContent={detailsContent}
        />
      </FormProvider>
      <LedgerFullViewPromptModal {...ledgerPromptProps} />
    </>
  );
};
