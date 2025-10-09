import React, { FC, useCallback, useMemo, useState } from 'react';

import { getStatus, LiFiStep } from '@lifi/sdk';
import retry from 'async-retry';
import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form-v7';
import { isAddress } from 'viem';

import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { EvmStepReviewData } from 'app/pages/Swap/form/interfaces';
import { formatDuration, getBufferedExecutionDuration } from 'app/pages/Swap/form/utils';
import { parseTxRequestToViem, timeout } from 'app/pages/Swap/modals/ConfirmSwap/utils';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { toastError } from 'app/toaster';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

import { BaseContent } from './BaseContent';

interface EvmContentProps {
  stepReviewData: EvmStepReviewData;
  onClose: EmptyFn;
  onStepCompleted: EmptyFn;
}

export const EvmContent: FC<EvmContentProps> = ({ stepReviewData, onClose, onStepCompleted }) => {
  const {
    account,
    inputNetwork,
    outputNetwork,
    protocolFee,
    destinationChainGasTokenAmount,
    minimumReceived,
    routeStep
  } = stepReviewData;

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const inputTokenSlug = useMemo(() => {
    return EVM_ZERO_ADDRESS === routeStep.action.fromToken.address
      ? EVM_TOKEN_SLUG
      : toTokenSlug(routeStep.action.fromToken.address, 0);
  }, [routeStep.action.fromToken.address]);

  const outputTokenSlug = useMemo(() => {
    return EVM_ZERO_ADDRESS === routeStep.action.toToken.address
      ? EVM_TOKEN_SLUG
      : toTokenSlug(routeStep.action.toToken.address, 0);
  }, [routeStep.action.toToken.address]);

  const { sendEvmTransaction } = useTempleClient();
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, inputNetwork);
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const { value: balance = ZERO } = useEvmAssetBalance(inputTokenSlug, accountPkh, inputNetwork);

  const txTo = routeStep?.transactionRequest?.to as HexString | undefined;
  const isValidTxTo = Boolean(txTo && isAddress(txTo));

  const { data: estimationData } = useEvmEstimationData({
    to: (isValidTxTo ? txTo : accountPkh) as HexString,
    assetSlug: inputTokenSlug,
    accountPkh,
    network: inputNetwork,
    balance,
    ethBalance,
    toFilled: isValidTxTo,
    amount: atomsToTokens(
      new BigNumber(routeStep.estimate.fromAmount),
      routeStep.action.fromToken.decimals ?? 0
    ).toString(),
    silent: false
  });

  const lifiEstimationData = useMemo(() => {
    if (!estimationData || !routeStep.transactionRequest) return undefined;

    return {
      ...estimationData,
      data: routeStep.transactionRequest.data as HexString
    };
  }, [estimationData, routeStep.transactionRequest]);

  const { form, tab, setTab, selectedFeeOption, handleFeeOptionSelect, feeOptions, displayedFee, getFeesPerGas } =
    useEvmEstimationForm(lifiEstimationData, null, account, inputNetwork.chainId);
  const { formState } = form;
  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();
  const [submitLoading, setSubmitLoading] = useState(false);

  const balancesChanges = useMemo(() => {
    const input = {
      [inputTokenSlug]: {
        atomicAmount: new BigNumber(-routeStep.estimate.fromAmount),
        isNft: false
      }
    };

    const output = {
      [outputTokenSlug]: {
        atomicAmount: new BigNumber(routeStep.estimate.toAmount),
        isNft: false
      }
    };

    if (destinationChainGasTokenAmount?.gt(0) && outputNetwork?.currency.address) {
      output[outputNetwork.currency.address] = {
        atomicAmount: tokensToAtoms(destinationChainGasTokenAmount, outputNetwork.currency.decimals),
        isNft: false
      };
    }

    return [input, output];
  }, [
    destinationChainGasTokenAmount,
    outputNetwork?.currency.address,
    outputNetwork?.currency.decimals,
    inputTokenSlug,
    routeStep.estimate.fromAmount,
    routeStep.estimate.toAmount,
    outputTokenSlug
  ]);

  const bridgeData = useMemo(() => {
    if (!outputNetwork || !inputNetwork) return undefined;
    const info = {
      inputNetwork,
      outputNetwork,
      executionTime: formatDuration(getBufferedExecutionDuration(routeStep?.estimate?.executionDuration)),
      protocolFee,
      destinationChainGasTokenAmount: destinationChainGasTokenAmount
    };
    return inputNetwork?.chainId !== outputNetwork?.chainId ? info : undefined;
  }, [
    destinationChainGasTokenAmount,
    inputNetwork,
    outputNetwork,
    protocolFee,
    routeStep?.estimate?.executionDuration
  ]);

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

      if (!txParams) {
        console.error(`Failed to parse transactionRequest for step ${step.tool}`);
        return;
      }

      const txHash = await sendEvmTransaction(accountPkh, inputNetwork, txParams);

      const blockExplorer = getActiveBlockExplorer(inputNetwork.chainId.toString(), !!bridgeData);
      showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);

      await timeout(2000);
      let status;
      do {
        const result = await retry(
          async () =>
            await getStatus({
              txHash,
              fromChain: step.action.fromChainId,
              toChain: step.action.toChainId,
              bridge: step.tool
            }),
          { retries: 2, minTimeout: 1000, factor: 2 }
        );
        status = result.status;

        console.log(`Transaction status for ${txHash}:`, status);

        await new Promise(resolve => setTimeout(resolve, 5000));
      } while (status !== 'DONE' && status !== 'FAILED');

      if (status === 'FAILED') {
        console.error(`Transaction ${txHash} failed`);
        onClose();
        return;
      }

      onStepCompleted();
    },
    [accountPkh, bridgeData, getActiveBlockExplorer, inputNetwork, onClose, onStepCompleted, sendEvmTransaction]
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
          new BigNumber(routeStep.action.fromAmount),
          routeStep.action.fromToken.decimals ?? 0
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
        setSubmitLoading(true);
        if (isLedgerAccount) {
          await runConnectedLedgerOperationFlow(
            () =>
              executeRouteStep(routeStep, {
                gasPrice,
                gasLimit,
                nonce
              }),
            setLedgerApprovalModalState,
            true
          );
        } else {
          await executeRouteStep(routeStep, { gasPrice, gasLimit, nonce });
        }
      } catch (err: any) {
        console.error(err);

        setLatestSubmitError(err.message);
        setTab('error');
      } finally {
        setSubmitLoading(false);
      }
    },
    [
      formState.isSubmitting,
      getFeesPerGas,
      lifiEstimationData,
      inputTokenSlug,
      ethBalance,
      displayedFee,
      routeStep,
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
        network={inputNetwork}
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
        bridgeData={bridgeData}
        submitLoadingOverride={submitLoading}
      />
    </FormProvider>
  );
};
