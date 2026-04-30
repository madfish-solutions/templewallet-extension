import React, { FC, useCallback, useMemo, useRef, useState } from 'react';

import { omit } from 'lodash';
import { FormProvider } from 'react-hook-form';
import { TransactionRequest } from 'viem';

import { HashChip } from 'app/atoms/HashChip';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { buildBasicEvmSendParams } from 'app/pages/Send/build-basic-evm-send-params';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { dispatch } from 'app/store';
import { addCrossChainExchangeAction, monitorCrossChainExchangesAction } from 'app/store/cross-chain-send/actions';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';
import {
  addPendingEvmTransferAction,
  monitorPendingTransfersAction
} from 'app/store/evm/pending-transactions/actions';
import { CurrentAccount } from 'app/templates/current-account';
import { FeeSummary } from 'app/templates/fee-summary';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { AdvancedTab } from 'app/templates/TransactionTabs/tabs/advanced';
import { ErrorTab } from 'app/templates/TransactionTabs/tabs/error';
import { FeeTab } from 'app/templates/TransactionTabs/tabs/fee';
import { EvmTxParamsFormData, Tab } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { useAnalytics } from 'lib/analytics';
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

import { CrossChainAnalyticsEvents } from '../../analytics';

import { ExpectedResultCard, NetworkRows } from './preview-shared';
import { ConfirmCrossChainReviewData, ConfirmCrossChainStep } from './types';

interface Props {
  data: ConfirmCrossChainReviewData;
  exchange: ExchangeData;
  account: AccountForChain<TempleChainKind.EVM>;
  network: EvmChain;
  onStepChange: (step: ConfirmCrossChainStep, exchangeId: string) => void;
  onCancel: EmptyFn;
}

const FORM_ID = 'cross-chain-confirm-evm-form';

export const PreviewBodyEvm: FC<Props> = props => (
  <EvmEstimationDataProvider>
    <PreviewBodyEvmInner {...props} />
  </EvmEstimationDataProvider>
);

const PreviewBodyEvmInner: FC<Props> = ({ data, exchange, account, network, onStepChange, onCancel }) => {
  const { fromAsset, toAsset, fromAmount, toAmountEstimated, recipient } = data;

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const currentAccount = useAccount();
  const { sendEvmTransaction } = useTempleClient();
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();
  const { trackEvent } = useAnalytics();

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

  const detailsRef = useRef<HTMLDivElement>(null);
  const feeRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const onSubmitError = useCallback(
    (err: unknown) => {
      console.error(err);
      setLatestSubmitError(err);
      setTab('error');
    },
    [setTab]
  );

  const segments = useMemo(
    () => [
      { label: t('details'), value: 'details' as const, ref: detailsRef },
      { label: t('fee'), value: 'fee' as const, ref: feeRef },
      { label: t('advanced'), value: 'advanced' as const, ref: advancedRef },
      ...(latestSubmitError || estimationError
        ? [{ label: t('error'), value: 'error' as const, ref: errorRef }]
        : [])
    ],
    [latestSubmitError, estimationError]
  );

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
      if (formState.isSubmitting) return;

      const feesPerGas = getFeesPerGas(gasPrice);

      if (!assetMetadata) {
        onSubmitError(new Error('Asset metadata not found.'));
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

          const storedExchange: CrossChainExchange = {
            id: exchange.id,
            accountId: currentAccount.id,
            sourceChainKind: TempleChainKind.EVM,
            sourceChainId: network.chainId,
            senderAddress: accountPkh,
            sourceTxHash: txHash,
            depositAddress: exchange.depositAddress,
            depositExtraId: exchange.depositExtraId,
            recipient: recipient.trim(),
            fromAsset,
            toAsset,
            fromAmount,
            toAmountEstimated,
            phase: 'PENDING_TX',
            exolixStatus: exchange.status,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          dispatch(addCrossChainExchangeAction(storedExchange));
          dispatch(monitorCrossChainExchangesAction());

          trackEvent(CrossChainAnalyticsEvents.CrossChainConfirmed, undefined, {
            exchangeId: exchange.id,
            from: fromAsset.exolixCoin,
            fromNetwork: fromAsset.exolixNetwork,
            to: toAsset.exolixCoin,
            toNetwork: toAsset.exolixNetwork,
            amount: fromAmount
          });

          onStepChange(ConfirmCrossChainStep.Processing, exchange.id);
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
      trackEvent,
      onStepChange,
      isLedgerAccount,
      account.type,
      guard,
      setLedgerApprovalModalState,
      preconnectIfNeeded
    ]
  );

  return (
    <FormProvider {...form}>
      <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-4 pt-3 pb-4 flex flex-col gap-y-4">
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

        <SegmentedControl<Tab>
          name="cross-chain-evm-preview-tabs"
          activeSegment={tab}
          setActiveSegment={setTab}
          segments={segments}
        />

        {tab === 'details' && (
          <NetworkRows
            recipientNode={<HashChip hash={recipient} firstCharsCount={6} lastCharsCount={6} />}
            fromAsset={fromAsset}
            toAsset={toAsset}
          />
        )}

        {tab === 'fee' && (
          <FeeTab
            network={network}
            assetSlug={EVM_TOKEN_SLUG}
            displayedFeeOptions={feeOptions?.displayed}
            selectedOption={selectedFeeOption}
            onOptionSelect={handleFeeOptionSelect}
          />
        )}

        {tab === 'advanced' && <AdvancedTab isEvm />}

        {tab === 'error' && (
          <ErrorTab isEvm submitError={latestSubmitError} estimationError={estimationError} />
        )}
      </form>

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
