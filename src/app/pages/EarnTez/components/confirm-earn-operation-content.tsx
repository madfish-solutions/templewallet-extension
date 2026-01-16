import React, { ComponentType, useCallback, useEffect, useMemo, useState } from 'react';

import { TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form';
import { SWRResponse } from 'swr';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { ActionModalButton } from 'app/atoms/action-modal';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { BalancesChangesView } from 'app/templates/balances-changes-view';
import { CurrentAccount } from 'app/templates/current-account';
import { FeeSummary } from 'app/templates/fee-summary';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { TezosTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useTezosEstimationForm } from 'app/templates/TransactionTabs/use-tezos-estimation-form';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { t, T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { TezosEstimationData, TezosEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { ZERO } from 'lib/utils/numbers';
import { getTezosToolkitWithSigner } from 'temple/front';
import { AssetsAmounts } from 'temple/types';

import { TezosEarnReviewDataBase } from '../types';

interface TxTabsInnerContentProps<R extends TezosEarnReviewDataBase> {
  reviewData: R;
  tezBalance: BigNumber;
  estimationData?: TezosEstimationData;
}

export interface RenderTopElementProps<R extends TezosEarnReviewDataBase> {
  reviewData: R;
  displayedFee: string | undefined;
  displayedStorageFee: string | undefined;
  goToFeeTab: EmptyFn;
}

export interface ConfirmEarnOperationContentProps<R extends TezosEarnReviewDataBase> {
  getBasicParamsSWRKey: (reviewData: R) => string[];
  formId: string;
  balancesChanges: AssetsAmounts[];
  reviewData?: R;
  TopElement?: ComponentType<RenderTopElementProps<R>>;
  cancelTestID: string;
  confirmTestID: string;
  confirmText?: ReactChildren;
  TxTabsInnerContent?: ComponentType<TxTabsInnerContentProps<R>>;
  getBasicParams: (reviewData: R, tezos: TezosToolkit) => Promise<WalletParamsWithKind[]>;
  useEstimationData: (reviewData: R, tezos: TezosToolkit, tezBalance: BigNumber) => SWRResponse<TezosEstimationData>;
  onCancel: EmptyFn;
}

export const ConfirmEarnOperationContent = <R extends TezosEarnReviewDataBase>({
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
        <TezosEstimationDataProvider>
          {reviewData ? (
            <ConfirmEarnOperationContentBodyWrapper
              formId={formId}
              data={reviewData}
              setLoading={setLoading}
              {...restProps}
            />
          ) : null}
        </TezosEstimationDataProvider>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
};

interface ConfirmEarnOperationContentBodyWrapperProps<R extends TezosEarnReviewDataBase>
  extends Pick<
    ConfirmEarnOperationContentProps<R>,
    | 'TopElement'
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

const ConfirmEarnOperationContentBodyWrapper = <R extends TezosEarnReviewDataBase>({
  getBasicParamsSWRKey,
  TxTabsInnerContent,
  data,
  formId,
  TopElement,
  balancesChanges,
  getBasicParams,
  useEstimationData,
  setLoading
}: ConfirmEarnOperationContentBodyWrapperProps<R>) => {
  const { account, network, onConfirm } = data;
  const { address: accountPkh, ownerAddress } = account;

  const isLedgerAccount = account.type === TempleAccountType.Ledger;
  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);

  const tezos = getTezosToolkitWithSigner(network, ownerAddress || accountPkh, true);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);
  const { data: estimationData, error: estimationError } = useEstimationData(data, tezos, tezBalance);

  const localGetBasicParams = useCallback(() => getBasicParams(data, tezos), [data, getBasicParams, tezos]);
  const { data: basicParams } = useTypedSWR(getBasicParamsSWRKey(data), localGetBasicParams);
  const estimationDataLoading = !estimationData && !estimationError;
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
    assertCustomGasFeeNotTooLow
  } = useTezosEstimationForm({
    estimationData,
    basicParams,
    senderAccount: account,
    network,
    estimationDataLoading,
    isEstimationError: Boolean(estimationError)
  });
  const { formState } = form;
  useEffect(
    () => setLoading(estimationDataLoading || formState.isSubmitting),
    [estimationDataLoading, formState.isSubmitting, setLoading]
  );

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
    async ({ gasFee, storageLimit }: TezosTxParamsFormData) => {
      try {
        if (formState.isSubmitting) return;

        try {
          assertCustomGasFeeNotTooLow(gasFee);
        } catch (e) {
          onSubmitError(e);

          return;
        }

        if (!estimationData || !displayedFeeOptions) {
          onSubmitError(estimationError);

          return;
        }

        const doOperation = async () => {
          const op = await submitOperation(tezos, gasFee, storageLimit, estimationData.revealFee, displayedFeeOptions);

          onConfirm(op!.opHash);
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
      displayedFeeOptions,
      estimationData,
      estimationError,
      formState.isSubmitting,
      isLedgerAccount,
      setLedgerApprovalModalState,
      onConfirm,
      onSubmitError,
      submitOperation,
      tezos,
      assertCustomGasFeeNotTooLow
    ]
  );

  const goToFeeTab = useCallback(() => setTab('fee'), [setTab]);

  const topElement = useMemo(
    () =>
      TopElement ? (
        <TopElement
          displayedFee={displayedFee}
          displayedStorageFee={displayedStorageFee}
          reviewData={data}
          goToFeeTab={goToFeeTab}
        />
      ) : (
        <div className="my-4">
          <BalancesChangesView
            balancesChanges={balancesChanges}
            title={t('simulatedResult')}
            chain={network}
            footer={
              <FeeSummary
                network={network}
                assetSlug={TEZ_TOKEN_SLUG}
                gasFee={displayedFee}
                storageFee={displayedStorageFee}
                onOpenFeeTab={goToFeeTab}
                embedded
              />
            }
          />
        </div>
      ),
    [balancesChanges, data, displayedFee, displayedStorageFee, goToFeeTab, network, TopElement]
  );

  return (
    <FormProvider {...form}>
      <div className="flex flex-col">
        {topElement}

        <CurrentAccount />

        <div className="flex flex-col">
          <TransactionTabs<TezosTxParamsFormData>
            network={network}
            nativeAssetSlug={TEZ_TOKEN_SLUG}
            selectedTab={tab}
            setSelectedTab={setTab}
            selectedFeeOption={selectedFeeOption}
            latestSubmitError={latestSubmitError}
            estimationError={estimationError}
            onFeeOptionSelect={handleFeeOptionSelect}
            onSubmit={onSubmit}
            displayedFeeOptions={displayedFeeOptions}
            formId={formId}
            tabsName={`${formId}-tabs`}
            destinationName={null}
            destinationValue={null}
          >
            {TxTabsInnerContent ? (
              <TxTabsInnerContent reviewData={data} tezBalance={tezBalance} estimationData={estimationData} />
            ) : null}
          </TransactionTabs>
        </div>
      </div>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={handleLedgerModalClose} />
    </FormProvider>
  );
};
