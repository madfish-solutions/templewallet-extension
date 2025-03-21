import React, { ComponentType, useCallback, useEffect, useState } from 'react';

import { TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form-v7';
import { SWRResponse } from 'swr';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { ActionModalButton } from 'app/atoms/action-modal';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { CurrentAccount } from 'app/templates/current-account';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { TezosTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useTezosEstimationForm } from 'app/templates/TransactionTabs/use-tezos-estimation-form';
import { toastError } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { TezosEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { TezosEstimationData, TezosReviewData } from 'lib/temple/front/estimation-data-providers/types';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { ZERO } from 'lib/utils/numbers';
import { getTezosToolkitWithSigner } from 'temple/front';

type TezosReviewDataBase = TezosReviewData<{ onConfirm: EmptyFn }>;

interface TxTabsInnerContentProps<R extends TezosReviewDataBase> {
  reviewData: R;
  tezBalance: BigNumber;
  estimationData?: TezosEstimationData;
}

export interface ConfirmEarnOperationContentProps<R extends TezosReviewDataBase> {
  getBasicParamsSWRKey: (reviewData: R) => string[];
  formId: string;
  reviewData?: R;
  topElement: (reviewData: R) => ReactChildren;
  cancelTestID: string;
  confirmTestID: string;
  confirmText?: ReactChildren;
  TxTabsInnerContent?: ComponentType<TxTabsInnerContentProps<R>>;
  getBasicParams: (reviewData: R, tezos: TezosToolkit) => Promise<WalletParamsWithKind[]>;
  useEstimationData: (reviewData: R, tezos: TezosToolkit, tezBalance: BigNumber) => SWRResponse<TezosEstimationData>;
  onCancel: EmptyFn;
}

export const ConfirmEarnOperationContent = <R extends TezosReviewDataBase>({
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

interface ConfirmEarnOperationContentBodyWrapperProps<R extends TezosReviewDataBase>
  extends Pick<
    ConfirmEarnOperationContentProps<R>,
    'topElement' | 'getBasicParamsSWRKey' | 'getBasicParams' | 'useEstimationData' | 'TxTabsInnerContent' | 'formId'
  > {
  data: R;
  topElement: (reviewData: R) => ReactChildren;
  setLoading: SyncFn<boolean>;
}

const ConfirmEarnOperationContentBodyWrapper = <R extends TezosReviewDataBase>({
  getBasicParamsSWRKey,
  TxTabsInnerContent,
  data,
  formId,
  topElement,
  getBasicParams,
  useEstimationData,
  setLoading
}: ConfirmEarnOperationContentBodyWrapperProps<R>) => {
  const { account, network, onConfirm } = data;
  const { address: accountPkh, ownerAddress } = account;
  const { rpcBaseURL, chainId } = network;

  const isLedgerAccount = account.type === TempleAccountType.Ledger;
  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const tezos = getTezosToolkitWithSigner(rpcBaseURL, ownerAddress || accountPkh, true);
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
    displayedStorageFee
  } = useTezosEstimationForm({
    estimationData,
    basicParams,
    senderAccount: account,
    rpcBaseURL,
    chainId,
    estimationDataLoading
  });
  const { formState } = form;
  useEffect(
    () => setLoading(estimationDataLoading || formState.isSubmitting),
    [estimationDataLoading, formState.isSubmitting, setLoading]
  );

  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const onSubmit = useCallback(
    async ({ gasFee, storageLimit }: TezosTxParamsFormData) => {
      try {
        if (formState.isSubmitting) return;

        if (!estimationData || !displayedFeeOptions) {
          toastError('Failed to estimate transaction.');

          return;
        }

        const doOperation = async () => {
          await submitOperation(tezos, gasFee, storageLimit, estimationData.revealFee, displayedFeeOptions);

          onConfirm();
        };

        if (isLedgerAccount) {
          await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
        } else {
          await doOperation();
        }
      } catch (err: any) {
        console.error(err);

        setLatestSubmitError(err.errors ? JSON.stringify(err.errors) : err.message);
        setTab('error');
      }
    },
    [
      displayedFeeOptions,
      estimationData,
      formState.isSubmitting,
      isLedgerAccount,
      setLedgerApprovalModalState,
      onConfirm,
      setTab,
      submitOperation,
      tezos
    ]
  );

  return (
    <FormProvider {...form}>
      <div className="flex flex-col pt-4">
        <div className="mb-6 flex flex-col">{topElement(data)}</div>

        <CurrentAccount />

        <div className="flex flex-col">
          <TransactionTabs<TezosTxParamsFormData>
            network={network}
            nativeAssetSlug={TEZ_TOKEN_SLUG}
            selectedTab={tab}
            setSelectedTab={setTab}
            selectedFeeOption={selectedFeeOption}
            latestSubmitError={latestSubmitError}
            onFeeOptionSelect={handleFeeOptionSelect}
            onSubmit={onSubmit}
            displayedFee={displayedFee}
            displayedStorageFee={displayedStorageFee}
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
