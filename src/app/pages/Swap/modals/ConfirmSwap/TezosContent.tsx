import React, { FC, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form-v7';

import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { BaseContent } from 'app/pages/Swap/modals/ConfirmSwap/BaseContent';
import { TezosTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useTezosEstimationForm } from 'app/templates/TransactionTabs/use-tezos-estimation-form';
import { toastError } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { mutezToTz } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { ZERO } from 'lib/utils/numbers';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { getParamsWithCustomGasLimitFor3RouteSwap } from 'lib/utils/swap.utils';
import { getTezosToolkitWithSigner } from 'temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

import { TezosReviewData } from '../../form/interfaces';

interface TezosContentProps {
  data: TezosReviewData;
  onClose: EmptyFn;
}

export const TezosContent: FC<TezosContentProps> = ({ data, onClose }) => {
  const { opParams, account, network, cashbackInTkey, minimumReceived, onConfirm } = data;
  const { rpcBaseURL, chainId } = network;

  const accountPkh = account.address;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();

  const tezos = getTezosToolkitWithSigner(rpcBaseURL, account.ownerAddress || accountPkh, true);

  const estimate = useCallback(async () => {
    try {
      const route3HandledParams = await getParamsWithCustomGasLimitFor3RouteSwap(tezos, opParams);
      const estimates = await tezos.estimate.batch(
        route3HandledParams.map(params => ({ ...params, source: account.ownerAddress || accountPkh }))
      );

      const estimatedBaseFee = mutezToTz(
        BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez + est.burnFeeMutez))
      );

      if (estimatedBaseFee.isGreaterThanOrEqualTo(tezBalance)) {
        throw new Error(t('balanceTooLow'));
      }

      return {
        estimates: estimates.map(serializeEstimate),
        baseFee: estimatedBaseFee,
        gasFee: mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez))),
        revealFee: mutezToTz(estimates.length > opParams.length ? estimates[0].suggestedFeeMutez : 0)
      };
    } catch (err) {
      console.error(err);
      return;
    }
  }, [tezos, opParams, tezBalance, account.ownerAddress, accountPkh]);

  const { data: estimationData, isLoading: estimationDataLoading } = useTypedSWR(
    () => ['tezos-estimation-data', chainId, accountPkh, opParams],
    estimate,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: TEZOS_BLOCK_DURATION
    }
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
    balancesChanges
  } = useTezosEstimationForm({
    estimationData,
    basicParams: opParams,
    senderAccount: account,
    simulateOperation: true,
    estimationDataLoading,
    rpcBaseURL,
    chainId
  });
  const { formState } = form;

  const filteredBalancesChanges = useMemo(
    () => Object.fromEntries(Object.entries(balancesChanges).filter(([, { atomicAmount }]) => !atomicAmount.isZero())),
    [balancesChanges]
  );
  const someBalancesChanges = useMemo(() => Object.keys(filteredBalancesChanges).length > 0, [filteredBalancesChanges]);

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
          const operation = await submitOperation(
            tezos,
            gasFee,
            storageLimit,
            estimationData.revealFee,
            displayedFeeOptions
          );

          onConfirm(operation);
          onClose();

          // @ts-expect-error
          const txHash = operation?.hash || operation?.opHash;

          const blockExplorer = getActiveBlockExplorer(network.chainId);

          showTxSubmitToastWithDelay(TempleChainKind.Tezos, txHash, blockExplorer.url);
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
      getActiveBlockExplorer,
      network.chainId,
      onClose,
      onConfirm,
      setTab,
      submitOperation,
      tezos
    ]
  );

  return (
    <FormProvider {...form}>
      <BaseContent<TezosTxParamsFormData>
        ledgerApprovalModalState={ledgerApprovalModalState}
        onLedgerModalClose={handleLedgerModalClose}
        network={network}
        nativeAssetSlug={TEZ_TOKEN_SLUG}
        selectedTab={tab}
        setSelectedTab={setTab}
        latestSubmitError={latestSubmitError}
        selectedFeeOption={selectedFeeOption}
        onFeeOptionSelect={handleFeeOptionSelect}
        displayedFee={displayedFee}
        displayedFeeOptions={displayedFeeOptions}
        displayedStorageFee={displayedStorageFee}
        cashbackInTkey={cashbackInTkey}
        minimumReceived={minimumReceived}
        onCancel={onClose}
        onSubmit={onSubmit}
        someBalancesChanges={someBalancesChanges}
        filteredBalancesChanges={[filteredBalancesChanges]}
      />
    </FormProvider>
  );
};
