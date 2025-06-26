import React, { FC, useCallback, useMemo, useState } from 'react';

import { LiFiStep } from '@lifi/sdk';
import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form-v7';

import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { EvmReviewData } from 'app/pages/Swap/form/interfaces';
import { mapLiFiTxToEvmEstimationData, parseTxRequestToViem } from 'app/pages/Swap/modals/ConfirmSwap/utils';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { toastError } from 'app/toaster';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS, VITALIK_ADDRESS } from 'lib/constants';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

import { BaseContent } from './BaseContent';

interface EvmContentProps {
  data: EvmReviewData;
  onClose: EmptyFn;
}

export const EvmContent: FC<EvmContentProps> = ({ data, onClose }) => {
  const { account, network, minimumReceived, onConfirm, lifiStep } = data;

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const inputTokenSlug = useMemo(() => {
    return EVM_ZERO_ADDRESS === lifiStep.action.fromToken.address
      ? EVM_TOKEN_SLUG
      : toTokenSlug(lifiStep.action.fromToken.address, 0);
  }, [lifiStep.action.fromToken.address]);

  const outputTokenSlug = useMemo(() => {
    return EVM_ZERO_ADDRESS === lifiStep.action.toToken.address
      ? EVM_TOKEN_SLUG
      : toTokenSlug(lifiStep.action.toToken.address, 0);
  }, [lifiStep.action.toToken.address]);

  const { sendEvmTransaction } = useTempleClient();
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, network);
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const { value: balance = ZERO } = useEvmAssetBalance(inputTokenSlug, accountPkh, network);
  const { data: toVitalikEstimationData } = useEvmEstimationData({
    to: VITALIK_ADDRESS,
    assetSlug: inputTokenSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    toFilled: true,
    silent: true
  });

  const lifiEstimationData = useMemo(
    () => ({
      ...mapLiFiTxToEvmEstimationData(lifiStep.transactionRequest!),
      nonce: toVitalikEstimationData?.nonce ?? 0
    }),
    [lifiStep, toVitalikEstimationData]
  );

  const { form, tab, setTab, selectedFeeOption, handleFeeOptionSelect, feeOptions, displayedFee, getFeesPerGas } =
    useEvmEstimationForm(lifiEstimationData, null, account, network.chainId);
  const { formState } = form;
  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const balancesChanges = useMemo(() => {
    return {
      [inputTokenSlug]: {
        atomicAmount: new BigNumber(-lifiStep.estimate.fromAmount),
        isNft: false
      },
      [outputTokenSlug]: {
        atomicAmount: new BigNumber(+lifiStep.estimate.toAmount),
        isNft: false
      }
    };
  }, [inputTokenSlug, lifiStep.estimate.fromAmount, lifiStep.estimate.toAmount, outputTokenSlug]);

  const executeRouteStep = useCallback(
    async (step: LiFiStep, { gasPrice, gasLimit, nonce }: Partial<EvmTxParamsFormData>) => {
      const transactionRequest = step.transactionRequest;
      if (!transactionRequest) {
        console.error(`No transactionRequest found for step ${step.tool}`);
        return;
      }

      const txParams = parseTxRequestToViem({
        ...transactionRequest,
        ...(gasPrice ? { gasPrice: gasPrice } : {}),
        ...(gasLimit ? { gas: BigInt(Number(gasLimit)) } : {}),
        ...(nonce ? { nonce: Number(nonce) } : {})
      });

      // TODO: remove after QA
      console.log('txParams', txParams);

      if (!txParams) {
        console.error(`Failed to parse transactionRequest for step ${step.tool}`);
        return;
      }

      const txHash = await sendEvmTransaction(accountPkh, network, txParams);

      const blockExplorer = getActiveBlockExplorer(network.chainId.toString());

      showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);

      onConfirm?.();
      onClose?.();
    },
    [accountPkh, network, sendEvmTransaction, getActiveBlockExplorer, onConfirm, onClose]
  );

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
      if (formState.isSubmitting) return;

      const feesPerGas = getFeesPerGas(gasPrice);
      if (!lifiEstimationData || !feesPerGas) {
        toastError('Failed to estimate transaction.');
        return;
      }

      if (isEvmNativeTokenSlug(inputTokenSlug)) {
        const fromAmount = atomsToTokens(
          new BigNumber(lifiStep.action.fromAmount),
          lifiStep.action.fromToken.decimals ?? 0
        );

        if (
          ethBalance
            .minus(displayedFee ?? 0)
            .minus(fromAmount)
            .lte(displayedFee ?? 0)
        ) {
          toastError(t('balanceTooLow'));
          return;
        }
      }

      if (ethBalance.lte(displayedFee ?? 0)) {
        toastError(t('balanceTooLow'));
        return;
      }

      try {
        if (isLedgerAccount) {
          await runConnectedLedgerOperationFlow(
            () =>
              executeRouteStep(lifiStep, {
                gasPrice,
                gasLimit,
                nonce
              }),
            setLedgerApprovalModalState,
            true
          );
        } else {
          await executeRouteStep(lifiStep, { gasPrice, gasLimit, nonce });
        }
      } catch (err: any) {
        console.error(err);

        setLatestSubmitError(err.message);
        setTab('error');
      }
    },
    [
      formState.isSubmitting,
      getFeesPerGas,
      lifiEstimationData,
      inputTokenSlug,
      ethBalance,
      displayedFee,
      lifiStep,
      isLedgerAccount,
      setLedgerApprovalModalState,
      executeRouteStep,
      setTab
    ]
  );

  return (
    <FormProvider {...form}>
      <BaseContent<EvmTxParamsFormData>
        ledgerApprovalModalState={ledgerApprovalModalState}
        onLedgerModalClose={handleLedgerModalClose}
        network={network}
        nativeAssetSlug={EVM_TOKEN_SLUG}
        selectedTab={tab}
        setSelectedTab={setTab}
        latestSubmitError={latestSubmitError}
        selectedFeeOption={selectedFeeOption}
        onFeeOptionSelect={handleFeeOptionSelect}
        displayedFee={displayedFee}
        displayedFeeOptions={feeOptions?.displayed}
        minimumReceived={minimumReceived}
        onCancel={onClose}
        onSubmit={onSubmit}
        someBalancesChanges={true}
        filteredBalancesChanges={balancesChanges}
      />
    </FormProvider>
  );
};
