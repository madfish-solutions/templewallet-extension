import React, { FC, useCallback, useState } from 'react';

import { omit } from 'lodash';
import { FormProvider } from 'react-hook-form';
import { TransactionRequest } from 'viem';

import { HashChip } from 'app/atoms/HashChip';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { buildBasicEvmSendParams } from 'app/pages/Send/build-basic-evm-send-params';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { dispatch } from 'app/store';
import { addPendingEvmTransferAction, monitorPendingTransfersAction } from 'app/store/evm/pending-transactions/actions';
import { CurrentAccount } from 'app/templates/current-account';
import { FeeSummary } from 'app/templates/fee-summary';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { ExchangeData } from 'lib/apis/exolix/types';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { T, t } from 'lib/i18n';
import { useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useTempleClient } from 'lib/temple/front';
import { EvmEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow, LedgerOperationState } from 'lib/ui';
import { useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { ZERO } from 'lib/utils/numbers';
import { AccountForChain } from 'temple/accounts';
import { EvmChain, useAccount } from 'temple/front';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { useSubmitCrossChainExchange } from '../../hooks/use-submit-cross-chain-exchange';

import { ExpectedResultCard, NetworkRows } from './preview-shared';
import { ConfirmCrossChainReviewData } from './types';

interface Props {
  data: ConfirmCrossChainReviewData;
  exchange: ExchangeData;
  account: AccountForChain<TempleChainKind.EVM>;
  network: EvmChain;
  onSubmitted: (exchangeId: string) => void;
  onCancel: EmptyFn;
}

const FORM_ID = 'cross-chain-confirm-evm-form';

export const PreviewBodyEvm: FC<Props> = props => (
  <EvmEstimationDataProvider>
    <PreviewBodyEvmInner {...props} />
  </EvmEstimationDataProvider>
);

const PreviewBodyEvmInner: FC<Props> = ({ data, exchange, account, network, onSubmitted, onCancel }) => {
  const { fromAsset, toAsset, fromAmount, toAmountEstimated, recipient } = data;

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const currentAccount = useAccount();
  const { sendEvmTransaction } = useTempleClient();
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();
  const recordCrossChainExchange = useSubmitCrossChainExchange();

  const assetMetadata = useEvmCategorizedAssetMetadata(fromAsset.assetSlug ?? '', network.chainId);
  const { value: balance = ZERO } = useEvmAssetBalance(fromAsset.assetSlug ?? '', accountPkh, network);
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, network);

  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);
  const { guard, preconnectIfNeeded, ledgerPromptProps } = useLedgerWebHidFullViewGuard();

  const { data: estimationData, error: estimationError } = useEvmEstimationData({
    to: exchange.depositAddress as HexString,
    assetSlug: fromAsset.assetSlug ?? '',
    accountPkh,
    network,
    balance,
    ethBalance,
    toFilled: true,
    amount: fromAmount,
    silent: true
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
      setLatestSubmitError(err);
      setTab('error');
    },
    [setTab]
  );

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
      if (formState.isSubmitting) return;

      const feesPerGas = getFeesPerGas(gasPrice);

      if (!assetMetadata) {
        onSubmitError(new Error(t('crossChainAssetMetadataNotFound')));
        return;
      }

      if (!estimationData || !feesPerGas) {
        onSubmitError(estimationError ?? new Error(t('estimationNotReady')));
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
          exchange.depositAddress as HexString,
          assetMetadata,
          fromAmount
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

          const blockExplorer = getActiveBlockExplorer(network.chainId.toString());
          dispatch(
            addPendingEvmTransferAction({
              txHash: txHash as HexString,
              accountPkh,
              assetSlug: fromAsset.assetSlug ?? '',
              network,
              blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.EVM),
              submittedAt: Date.now()
            })
          );
          dispatch(monitorPendingTransfersAction());

          recordCrossChainExchange({
            accountId: currentAccount.id,
            sourceChainKind: TempleChainKind.EVM,
            sourceChainId: network.chainId,
            senderAddress: accountPkh,
            txHash,
            exchange,
            fromAsset,
            toAsset,
            fromAmount,
            toAmountEstimated,
            recipient
          });

          onSubmitted(exchange.id);
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
      } catch (err: unknown) {
        onSubmitError(err);
      }
    },
    [
      formState.isSubmitting,
      getFeesPerGas,
      assetMetadata,
      estimationData,
      estimationError,
      onSubmitError,
      assertCustomFeesPerGasNotTooLow,
      accountPkh,
      exchange,
      fromAmount,
      sendEvmTransaction,
      network,
      getActiveBlockExplorer,
      fromAsset,
      toAsset,
      toAmountEstimated,
      recipient,
      currentAccount.id,
      recordCrossChainExchange,
      onSubmitted,
      isLedgerAccount,
      account.type,
      guard,
      setLedgerApprovalModalState,
      preconnectIfNeeded
    ]
  );

  return (
    <FormProvider {...form}>
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 flex flex-col gap-y-4">
        <ExpectedResultCard
          fromAsset={fromAsset}
          fromAmount={fromAmount}
          feeFooter={
            <FeeSummary
              embedded
              network={network}
              assetSlug={EVM_TOKEN_SLUG}
              gasFee={displayedFee}
              onOpenFeeTab={() => setTab('fee')}
            />
          }
        />

        <CurrentAccount />

        <TransactionTabs<EvmTxParamsFormData>
          network={network}
          nativeAssetSlug={EVM_TOKEN_SLUG}
          selectedTab={tab}
          setSelectedTab={setTab}
          selectedFeeOption={selectedFeeOption}
          latestSubmitError={latestSubmitError}
          onFeeOptionSelect={handleFeeOptionSelect}
          onSubmit={onSubmit}
          displayedFeeOptions={feeOptions?.displayed}
          estimationError={estimationError}
          formId={FORM_ID}
          tabsName="cross-chain-evm-preview-tabs"
          detailsContent={
            <NetworkRows
              recipientNode={<HashChip hash={recipient} firstCharsCount={6} lastCharsCount={6} />}
              fromAsset={fromAsset}
              toAsset={toAsset}
            />
          }
        />
      </div>

      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton
          size="L"
          className="w-full"
          color="primary-low"
          onClick={onCancel}
          disabled={formState.isSubmitting}
        >
          <T id="cancel" />
        </StyledButton>
        <StyledButton
          type="submit"
          form={FORM_ID}
          size="L"
          className="w-full"
          color="primary"
          loading={formState.isSubmitting}
        >
          <T id={latestSubmitError ? 'retry' : 'confirm'} />
        </StyledButton>
      </ActionsButtonsBox>

      <LedgerApprovalModal
        state={ledgerApprovalModalState}
        onClose={handleLedgerModalClose}
        chainKind={TempleChainKind.EVM}
      />
      <LedgerFullViewPromptModal {...ledgerPromptProps} />
    </FormProvider>
  );
};
