import React, { ComponentType, useCallback, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import { omit } from 'lodash';
import { FormProvider } from 'react-hook-form-v7';
import { SWRResponse } from 'swr';
import { TransactionRequest } from 'viem';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { ActionModalButton } from 'app/atoms/action-modal';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { dispatch } from 'app/store';
import { addPendingEvmTransferAction, monitorPendingTransfersAction } from 'app/store/evm/pending-transactions/actions';
import { BalancesChangesView } from 'app/templates/balances-changes-view';
import { CurrentAccount } from 'app/templates/current-account';
import { FeeSummary } from 'app/templates/fee-summary';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { EvmEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { ZERO } from 'lib/utils/numbers';
import { EvmEstimationData } from 'temple/evm/estimate';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { EvmNetworkEssentials } from 'temple/networks';
import { AssetsAmounts, TempleChainKind } from 'temple/types';

import { EthEarnReviewDataBase } from '../types';

interface TxTabsInnerContentProps<R extends EthEarnReviewDataBase> {
  reviewData: R;
  ethBalance: BigNumber;
  estimationData?: EvmEstimationData;
}

interface ConfirmEarnOperationContentProps<R extends EthEarnReviewDataBase> {
  getBasicParamsSWRKey: (reviewData: R) => string[];
  formId: string;
  balancesChanges: AssetsAmounts[];
  reviewData?: R;
  cancelTestID: string;
  confirmTestID: string;
  confirmText?: ReactChildren;
  TxTabsInnerContent?: ComponentType<TxTabsInnerContentProps<R>>;
  getBasicParams: (
    reviewData: R,
    network: EvmNetworkEssentials
  ) => Promise<Pick<TransactionRequest, 'from' | 'to' | 'value' | 'data'>>;
  useEstimationData: (
    reviewData: R,
    network: EvmNetworkEssentials,
    ethBalance: BigNumber
  ) => SWRResponse<EvmEstimationData>;
  onCancel: EmptyFn;
}

export const ConfirmEarnOperationContent = <R extends EthEarnReviewDataBase>({
  reviewData,
  cancelTestID,
  confirmTestID,
  confirmText,
  onCancel,
  formId,
  ...restProps
}: ConfirmEarnOperationContentProps<R>) => {
  const [loading, setLoading] = useState(true);

  return (
    <FadeTransition>
      <PageModalScrollViewWithActions
        actionsBoxProps={{
          flexDirection: 'row',
          children: (
            <>
              <ActionModalButton
                className="flex-1"
                color="primary-low"
                onClick={onCancel}
                disabled={loading}
                testID={cancelTestID}
              >
                <T id="cancel" />
              </ActionModalButton>
              <ActionModalButton
                className="flex-1"
                color="primary"
                type="submit"
                form={formId}
                loading={loading}
                testID={confirmTestID}
              >
                {confirmText ?? <T id="confirm" />}
              </ActionModalButton>
            </>
          )
        }}
      >
        <EvmEstimationDataProvider>
          {reviewData ? (
            <ConfirmEarnOperationContentBodyWrapper
              formId={formId}
              data={reviewData}
              setLoading={setLoading}
              {...restProps}
            />
          ) : null}
        </EvmEstimationDataProvider>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
};

interface ConfirmEarnOperationContentBodyWrapperProps<R extends EthEarnReviewDataBase>
  extends Pick<
    ConfirmEarnOperationContentProps<R>,
    | 'getBasicParamsSWRKey'
    | 'getBasicParams'
    | 'useEstimationData'
    | 'TxTabsInnerContent'
    | 'formId'
    | 'balancesChanges'
  > {
  data: R;
  setLoading: SyncFn<boolean>;
}

const ConfirmEarnOperationContentBodyWrapper = <R extends EthEarnReviewDataBase>({
  getBasicParamsSWRKey,
  TxTabsInnerContent,
  data,
  balancesChanges,
  formId,
  getBasicParams,
  useEstimationData,
  setLoading
}: ConfirmEarnOperationContentBodyWrapperProps<R>) => {
  const { account, network, onConfirm } = data;
  const { address: accountPkh } = account;

  const isLedgerAccount = account.type === TempleAccountType.Ledger;
  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);

  const { sendEvmTransaction } = useTempleClient();
  const { value: gasTokenBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh as HexString, network);
  const { data: estimationData, error: estimationError } = useEstimationData(data, network, gasTokenBalance);

  const localGetBasicParams = useCallback(() => getBasicParams(data, network), [data, getBasicParams, network]);
  const { data: basicParams } = useTypedSWR(getBasicParamsSWRKey(data), localGetBasicParams);
  const estimationDataLoading = !estimationData && !estimationError;
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
  } = useEvmEstimationForm(estimationData, basicParams, account, network.chainId);
  const { formState } = form;
  useEffect(
    () => setLoading(estimationDataLoading || formState.isSubmitting),
    [estimationDataLoading, formState.isSubmitting, setLoading]
  );

  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

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
      if (formState.isSubmitting || !basicParams) return;

      const feesPerGas = getFeesPerGas(gasPrice);

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
        const { value, to: txDestination } = basicParams;

        const doOperation = async () => {
          const txHash = await sendEvmTransaction(accountPkh as HexString, network, {
            to: txDestination,
            value,
            ...omit(estimationData, 'estimatedFee'),
            ...feesPerGas,
            ...(gasLimit ? { gas: BigInt(gasLimit) } : {}),
            ...(nonce ? { nonce: Number(nonce) } : {})
          } as TransactionRequest);

          onConfirm(txHash);

          const blockExplorer = getActiveBlockExplorer(network.chainId.toString());

          dispatch(
            addPendingEvmTransferAction({
              txHash,
              accountPkh: accountPkh as HexString,
              assetSlug: EVM_TOKEN_SLUG,
              network,
              blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.EVM),
              submittedAt: Date.now()
            })
          );
          dispatch(monitorPendingTransfersAction());
        };

        if (isLedgerAccount) {
          await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
        } else {
          await doOperation();
        }
      } catch (err: any) {
        onSubmitError(err);
      }
    },
    [
      accountPkh,
      assertCustomFeesPerGasNotTooLow,
      basicParams,
      estimationData,
      estimationError,
      formState.isSubmitting,
      getActiveBlockExplorer,
      getFeesPerGas,
      isLedgerAccount,
      network,
      onConfirm,
      onSubmitError,
      sendEvmTransaction,
      setLedgerApprovalModalState
    ]
  );

  const goToFeeTab = useCallback(() => setTab('fee'), [setTab]);

  return (
    <FormProvider {...form}>
      <div className="flex flex-col">
        <div className="my-4">
          <BalancesChangesView
            balancesChanges={balancesChanges}
            chain={network}
            footer={
              <FeeSummary
                network={network}
                assetSlug={EVM_TOKEN_SLUG}
                gasFee={displayedFee}
                onOpenFeeTab={goToFeeTab}
                embedded
              />
            }
          />
        </div>

        <CurrentAccount />

        <div className="flex flex-col">
          <TransactionTabs<EvmTxParamsFormData>
            network={network}
            nativeAssetSlug={EVM_TOKEN_SLUG}
            selectedTab={tab}
            setSelectedTab={setTab}
            selectedFeeOption={selectedFeeOption}
            latestSubmitError={latestSubmitError}
            estimationError={estimationError}
            onFeeOptionSelect={handleFeeOptionSelect}
            onSubmit={onSubmit}
            displayedFeeOptions={feeOptions?.displayed}
            formId={formId}
            tabsName={`${formId}-tabs`}
            destinationName={null}
            destinationValue={null}
          >
            {TxTabsInnerContent ? (
              <TxTabsInnerContent reviewData={data} ethBalance={gasTokenBalance} estimationData={estimationData} />
            ) : null}
          </TransactionTabs>
        </div>
      </div>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={handleLedgerModalClose} />
    </FormProvider>
  );
};
