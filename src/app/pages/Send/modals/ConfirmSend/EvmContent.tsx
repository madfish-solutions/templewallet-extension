import React, { FC, useCallback, useState } from 'react';

import { omit } from 'lodash';
import { FormProvider } from 'react-hook-form-v7';
import { TransactionRequest } from 'viem';

import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { EvmReviewData } from 'app/pages/Send/form/interfaces';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { dispatch } from 'app/store';
import { addPendingEvmTransferAction, monitorPendingTransfersAction } from 'app/store/evm/pending-transactions/actions';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow, LedgerOperationState } from 'lib/ui';
import { useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { buildBasicEvmSendParams } from '../../build-basic-evm-send-params';

import { BaseContent } from './BaseContent';
import { TxData } from './types';

interface EvmContentProps {
  data: EvmReviewData;
  onClose: EmptyFn;
  onSuccess: (txData: TxData<TempleChainKind.EVM>) => void;
}

export const EvmContent: FC<EvmContentProps> = ({ data, onClose, onSuccess }) => {
  const { account, network, assetSlug, to, amount, onConfirm } = data;

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const { sendEvmTransaction } = useTempleClient();

  const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, accountPkh, network);
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, network);
  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);
  const { guard, preconnectIfNeeded, ledgerPromptProps } = useLedgerWebHidFullViewGuard();

  const { data: estimationData, error: estimationError } = useEvmEstimationData({
    to: to as HexString,
    assetSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    toFilled: true,
    amount
  });

  const {
    form,
    tab,
    setTab,
    selectedFeeOption,
    handleFeeOptionSelect,
    feeOptions,
    displayedFee,
    getFeesPerGas,
    assertCustomFeesPerGasNotTooLow
  } = useEvmEstimationForm(estimationData, null, account, network.chainId);
  const { formState } = form;
  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const onSubmitError = useCallback(
    (err: unknown) => {
      console.error(err);
      setLatestSubmitError(err);
      setTab('error');
    },
    [setLatestSubmitError, setTab]
  );

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
      if (formState.isSubmitting) return;

      const feesPerGas = getFeesPerGas(gasPrice);

      if (!assetMetadata) {
        throw new Error('Asset metadata not found.');
      }

      if (!estimationData || !feesPerGas) {
        onSubmitError(estimationError);

        return;
      }

      try {
        assertCustomFeesPerGasNotTooLow(feesPerGas);
      } catch (e) {
        onSubmitError(e);

        return;
      }

      try {
        const { value, to: txDestination } = buildBasicEvmSendParams(
          accountPkh,
          to as HexString,
          assetMetadata,
          amount
        );

        const doOperation = async () => {
          const txHash = await sendEvmTransaction(accountPkh, network, {
            to: txDestination,
            value,
            ...omit(estimationData, 'estimatedFee'),
            ...feesPerGas,
            ...(gasLimit ? { gas: BigInt(gasLimit) } : {}),
            ...(nonce ? { nonce: Number(nonce) } : {})
          } as TransactionRequest);

          onConfirm();
          onSuccess({ txHash, displayedFee });

          const blockExplorer = getActiveBlockExplorer(network.chainId.toString());

          showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);

          dispatch(
            addPendingEvmTransferAction({
              txHash,
              accountPkh,
              assetSlug,
              network,
              blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.EVM),
              submittedAt: Date.now()
            })
          );
          dispatch(monitorPendingTransfersAction());
        };

        if (isLedgerAccount) {
          const redirected = await guard(account.type);
          if (redirected) return;
          setLedgerApprovalModalState(LedgerOperationState.InProgress);
          await preconnectIfNeeded(account.type, TempleChainKind.EVM);
          await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
        } else {
          await doOperation();
        }
      } catch (err: any) {
        onSubmitError(err);
      }
    },
    [
      formState.isSubmitting,
      getFeesPerGas,
      assetMetadata,
      estimationData,
      onSubmitError,
      estimationError,
      assertCustomFeesPerGasNotTooLow,
      accountPkh,
      to,
      amount,
      isLedgerAccount,
      sendEvmTransaction,
      network,
      onConfirm,
      onSuccess,
      getActiveBlockExplorer,
      guard,
      account.type,
      setLedgerApprovalModalState,
      assetSlug,
      preconnectIfNeeded,
      displayedFee
    ]
  );

  return (
    <>
      <FormProvider {...form}>
        <BaseContent<EvmTxParamsFormData>
          ledgerApprovalModalState={ledgerApprovalModalState}
          onLedgerModalClose={handleLedgerModalClose}
          network={network}
          assetSlug={assetSlug}
          amount={amount}
          recipientAddress={to}
          decimals={assetMetadata?.decimals}
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
      <LedgerFullViewPromptModal {...ledgerPromptProps} />
    </>
  );
};
