import React, { FC, useCallback, useMemo, useState } from 'react';

import { LiFiStep } from '@lifi/sdk';
import type { TransactionRequest as LiFiTxRequest } from '@lifi/types';
import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form-v7';
import { TransactionRequest } from 'viem';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { EvmReviewData } from 'app/pages/Swap/form/interfaces';
import { mapToEvmEstimationDataWithFallback, parseLiFiTxRequestToViem } from 'app/pages/Swap/modals/ConfirmSwap/utils';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { toastError, toastSuccess } from 'app/toaster';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';

import { BaseContent } from './BaseContent';

interface EvmContentProps {
  data: EvmReviewData;
  onClose: EmptyFn;
}

export const EvmContent: FC<EvmContentProps> = ({ data, onClose }) => {
  const { account, network, minimumReceived, onConfirm, lifiStep } = data;

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const fromTokenSlug = useMemo(() => {
    return EVM_ZERO_ADDRESS === lifiStep.action.fromToken.address
      ? EVM_TOKEN_SLUG
      : toTokenSlug(lifiStep.action.fromToken.address, 0);
  }, [lifiStep.action.fromToken.address]);

  const toTokenSLug = useMemo(() => {
    return EVM_ZERO_ADDRESS === lifiStep.action.toToken.address
      ? EVM_TOKEN_SLUG
      : toTokenSlug(lifiStep.action.toToken.address, 0);
  }, [lifiStep.action.toToken.address]);

  const { sendEvmTransaction } = useTempleClient();
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, network);
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const lifiEstimationData = useMemo(
    () => mapToEvmEstimationDataWithFallback(lifiStep.transactionRequest!),
    [lifiStep]
  );

  const { form, tab, setTab, selectedFeeOption, handleFeeOptionSelect, feeOptions, displayedFee, getFeesPerGas } =
    useEvmEstimationForm(lifiEstimationData, null, account, network.chainId);
  const { formState } = form;
  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const balancesChanges = useMemo(() => {
    return {
      [fromTokenSlug]: {
        atomicAmount: new BigNumber(-lifiStep.estimate.fromAmount),
        isNft: false
      },
      [toTokenSLug]: {
        atomicAmount: new BigNumber(+lifiStep.estimate.toAmount),
        isNft: false
      }
    };
  }, [fromTokenSlug, lifiStep.estimate.fromAmount, lifiStep.estimate.toAmount, toTokenSLug]);

  const executeRouteStep = useCallback(
    async (step: LiFiStep, { gasPrice, gasLimit, nonce }: Partial<EvmTxParamsFormData>) => {
      const transactionRequest = step.transactionRequest;
      if (!transactionRequest) {
        console.error(`No transactionRequest found for step ${step.tool}`);
        return;
      }

      const txHash = await sendEvmTransaction(accountPkh, network, {
        ...parseLiFiTxRequestToViem(transactionRequest as LiFiTxRequest),
        ...(gasPrice ? { gasPrice: BigInt(gasPrice) } : {}),
        ...(gasLimit ? { gas: BigInt(gasLimit) } : {}),
        ...(nonce ? { nonce: Number(nonce) } : {})
      } as TransactionRequest);

      const blockExplorer = getActiveBlockExplorer(network.chainId.toString());
      setTimeout(() => {
        toastSuccess(t('transactionSubmitted'), true, {
          hash: txHash,
          explorerBaseUrl: blockExplorer.url + '/tx/'
        });
      }, CLOSE_ANIMATION_TIMEOUT * 2);

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
      displayedFee,
      lifiEstimationData,
      ethBalance,
      executeRouteStep,
      formState.isSubmitting,
      getFeesPerGas,
      isLedgerAccount,
      lifiStep,
      setLedgerApprovalModalState,
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
