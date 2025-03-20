import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form-v7';
import { useDispatch } from 'react-redux';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Alert } from 'app/atoms';
import { ActionModalButton } from 'app/atoms/action-modal';
import { HashChip } from 'app/atoms/HashChip';
import { TextButton } from 'app/atoms/TextButton';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { CurrentAccount } from 'app/pages/Send/modals/ConfirmSend/components/CurrentAccount';
import { setOnRampPossibilityAction } from 'app/store/settings/actions';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { TezosTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useTezosEstimationForm } from 'app/templates/TransactionTabs/use-tezos-estimation-form';
import { toastError } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { T } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { TezosEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { ZERO } from 'lib/utils/numbers';
import { getTezosToolkitWithSigner } from 'temple/front';

import { BakerCard } from '../../components/baker-card';

import { getDelegationParams } from './estimate-delegation';
import { ReviewData } from './types';
import { useTezosEstimationData } from './use-tezos-estimation-data';

interface ConfirmDelegationContentProps {
  reviewData?: ReviewData;
  onCancel: EmptyFn;
}

export const ConfirmDelegationContent = memo<ConfirmDelegationContentProps>(({ reviewData, onCancel }) => {
  const [loading, setLoading] = useState(true);

  return (
    <FadeTransition>
      <PageModalScrollViewWithActions
        actionsBoxProps={{
          flexDirection: 'row',
          children: (
            <>
              <ActionModalButton className="flex-1" color="primary-low" onClick={onCancel} disabled={loading}>
                <T id="cancel" />
              </ActionModalButton>
              <ActionModalButton
                className="flex-1"
                color="primary"
                type="submit"
                form="confirm-delegation-form"
                loading={loading}
              >
                <T id="delegate" />
              </ActionModalButton>
            </>
          )
        }}
      >
        <TezosEstimationDataProvider>
          {reviewData ? <ConfirmDelegationContentBodyWrapper data={reviewData} setLoading={setLoading} /> : null}
        </TezosEstimationDataProvider>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
});

interface ConfirmDelegationContentBodyWrapperProps {
  data: ReviewData;
  setLoading: SyncFn<boolean>;
}

const ConfirmDelegationContentBodyWrapper = memo<ConfirmDelegationContentBodyWrapperProps>(({ data, setLoading }) => {
  const { baker, onConfirm, account, network } = data;
  const { rpcBaseURL, chainId } = network;
  const { address: accountPkh, ownerAddress } = account;
  const bakerAddress = typeof baker === 'string' ? baker : baker.address;
  const { symbol: tezSymbol } = getTezosGasMetadata(network.chainId);
  const dispatch = useDispatch();

  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const tezos = getTezosToolkitWithSigner(rpcBaseURL, ownerAddress || accountPkh, true);

  const { data: estimationData, error: estimationError } = useTezosEstimationData(
    bakerAddress,
    tezos,
    account,
    tezBalance
  );

  const delegatedAmount = useMemo(
    () => BigNumber.max(ZERO, tezBalance.minus(estimationData?.gasFee ?? ZERO)),
    [estimationData?.gasFee, tezBalance]
  );

  const getBasicDelegationParams = useCallback(
    () => getDelegationParams(account, bakerAddress, tezos),
    [account, bakerAddress, tezos]
  );
  const { data: basicParams } = useTypedSWR(
    ['get-basic-delegation-params', accountPkh, bakerAddress, rpcBaseURL, chainId],
    getBasicDelegationParams
  );

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

  const openWertPopup = useCallback(() => void dispatch(setOnRampPossibilityAction(true)), [dispatch]);

  const HeaderRight = useCallback(() => <HashChip hash={bakerAddress} />, [bakerAddress]);

  return (
    <FormProvider {...form}>
      <div className="flex flex-col pt-4">
        <BakerCard className="mb-6" network={network} accountPkh={accountPkh} baker={baker} HeaderRight={HeaderRight} />

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
            formId="confirm-delegation-form"
            tabsName="confirm-send-tabs"
            destinationName={null}
            destinationValue={null}
          >
            {typeof baker === 'object' && delegatedAmount.lt(baker.delegation.minBalance) && (
              <Alert
                className="mb-4"
                type="warning"
                closable={false}
                description={
                  <div className="flex flex-col gap-0.5">
                    <p className="text-font-description-bold">
                      <T id="minDelegationBalanceTitle" />
                    </p>
                    <p className="text-font-description">
                      <T id="minDelegationBalanceDescription" />
                    </p>
                    <div className="flex gap-1 items-center">
                      <span className="text-font-description">
                        <T id="topUp" /> {tezSymbol}:
                      </span>
                      <TextButton color="blue" onClick={openWertPopup}>
                        <T id="buyWithCardShort" />
                      </TextButton>
                    </div>
                  </div>
                }
              />
            )}
          </TransactionTabs>
        </div>
      </div>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={handleLedgerModalClose} />
    </FormProvider>
  );
});
