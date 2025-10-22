import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { LiFiStep } from '@lifi/sdk';
import retry from 'async-retry';
import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form-v7';
import { isAddress } from 'viem';

import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { EvmStepReviewData } from 'app/pages/Swap/form/interfaces';
import { formatDuration, getBufferedExecutionDuration } from 'app/pages/Swap/form/utils';
import { mapLiFiTxToEvmEstimationData, parseTxRequestToViem, timeout } from 'app/pages/Swap/modals/ConfirmSwap/utils';
import { dispatch } from 'app/store';
import { putNewEvmTokenAction } from 'app/store/evm/assets/actions';
import { processLoadedOnchainBalancesAction } from 'app/store/evm/balances/actions';
import { putEvmTokensMetadataAction } from 'app/store/evm/tokens-metadata/actions';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { toastError } from 'app/toaster';
import { getEvmSwapStatus } from 'lib/apis/temple/endpoints/evm';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { BaseContent } from './BaseContent';

export interface EvmContentProps {
  stepReviewData: EvmStepReviewData;
  onClose: EmptyFn;
  onStepCompleted: EmptyFn;
  cancelledRef?: React.MutableRefObject<boolean>;
  skipStatusWait?: boolean;
  submitDisabled?: boolean;
}

export const EvmContent: FC<EvmContentProps> = ({
  stepReviewData,
  onClose,
  onStepCompleted,
  cancelledRef,
  skipStatusWait,
  submitDisabled
}) => {
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
  const [stepFinalized, setStepFinalized] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    setStepFinalized(false);
  }, [routeStep]);

  const { value: balance = ZERO } = useEvmAssetBalance(inputTokenSlug, accountPkh, inputNetwork);

  const txTo = routeStep?.transactionRequest?.to as HexString | undefined;
  const isValidTxTo = Boolean(txTo && isAddress(txTo));

  const {
    data: estimationData,
    error: estimationError,
    isLoading: estimationLoading
  } = useEvmEstimationData({
    to: (isValidTxTo ? txTo : accountPkh) as HexString,
    assetSlug: inputTokenSlug,
    accountPkh,
    network: inputNetwork,
    balance,
    ethBalance,
    toFilled: isValidTxTo && !stepFinalized && !submitLoading && !cancelledRef?.current,
    amount: atomsToTokens(
      new BigNumber(routeStep.action.fromAmount),
      routeStep.action.fromToken.decimals ?? 0
    ).toString(),
    silent: true
  });

  const lifiEstimationData = useMemo(() => {
    if (!estimationData || !routeStep.transactionRequest) return undefined;
    const mappedLifiEstimation = mapLiFiTxToEvmEstimationData(routeStep.transactionRequest);

    return {
      ...estimationData,
      gas: 'gas' in mappedLifiEstimation ? mappedLifiEstimation.gas : estimationData?.gas,
      nonce: estimationData.nonce
    };
  }, [estimationData, routeStep.transactionRequest]);

  const { form, tab, setTab, selectedFeeOption, handleFeeOptionSelect, feeOptions, displayedFee, getFeesPerGas } =
    useEvmEstimationForm(lifiEstimationData, null, account, inputNetwork.chainId);
  const { formState } = form;
  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

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
      if (cancelledRef?.current) return;
      const transactionRequest = step.transactionRequest;
      if (!transactionRequest) {
        console.error(`No transactionRequest found for step ${step.tool}`);
        return;
      }

      const txParams = parseTxRequestToViem({
        ...transactionRequest,
        ...(gasPrice ? { gasPrice: gasPrice } : {}),
        ...(gasLimit ? { gasLimit } : {}),
        ...(nonce ? { nonce: Number(nonce) } : {})
      });

      if (!txParams) {
        console.error(`Failed to parse transactionRequest for step ${step.tool}`);
        return;
      }

      const txHash = await sendEvmTransaction(accountPkh, inputNetwork, txParams);

      const blockExplorer = getActiveBlockExplorer(inputNetwork.chainId.toString(), !!bridgeData);
      showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);

      if (skipStatusWait) {
        if (cancelledRef?.current) return;
        setStepFinalized(true);
        onStepCompleted();
        return;
      }

      let status;
      do {
        if (cancelledRef?.current) return;
        try {
          const result = await retry(
            async () =>
              await getEvmSwapStatus({
                txHash,
                fromChain: step.action.fromChainId,
                toChain: step.action.toChainId,
                bridge: step.tool
              }),
            { retries: 5, minTimeout: 2000 }
          );
          status = result.status;
        } catch (_err) {
          throw new Error(
            'This transaction wasn’t confirmed because the gas price is to low and didn’t meet network demand. Increase it to speed up confirmation and try again.'
          );
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
      } while (status !== 'DONE' && status !== 'FAILED');

      if (status === 'FAILED') {
        toastError('Transaction failed', true, {
          hash: txHash,
          blockExplorerHref: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.EVM)
        });
        return;
      }

      // Ensure the output token exists in the wallet for any execute step
      try {
        if (!isEvmNativeTokenSlug(outputTokenSlug)) {
          for (let attempt = 0; attempt < 20; attempt++) {
            const balance = await fetchEvmRawBalance(outputNetwork, outputTokenSlug, accountPkh);

            if (balance.gt(0)) {
              const metadata = await fetchEvmTokenMetadataFromChain(outputNetwork, outputTokenSlug);

              dispatch(
                putNewEvmTokenAction({
                  publicKeyHash: accountPkh,
                  chainId: outputNetwork.chainId,
                  assetSlug: outputTokenSlug
                })
              );

              dispatch(
                putEvmTokensMetadataAction({
                  chainId: outputNetwork.chainId,
                  records: { [outputTokenSlug]: metadata }
                })
              );

              dispatch(
                processLoadedOnchainBalancesAction({
                  balances: { [outputTokenSlug]: balance.toFixed() },
                  timestamp: Date.now(),
                  account: accountPkh,
                  chainId: outputNetwork.chainId
                })
              );

              break;
            }

            await timeout(3000);
          }
        }
      } catch (err) {
        console.warn('Failed to ensure output token is added to wallet', err);
      }

      if (cancelledRef?.current) return;
      setStepFinalized(true);
      onStepCompleted();
    },
    [
      accountPkh,
      bridgeData,
      getActiveBlockExplorer,
      inputNetwork,
      onStepCompleted,
      outputNetwork,
      outputTokenSlug,
      sendEvmTransaction,
      cancelledRef,
      skipStatusWait
    ]
  );

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
      if (submitDisabled) return;
      if (formState.isSubmitting) return;

      const feesPerGas = getFeesPerGas(gasPrice);
      if (!lifiEstimationData || !feesPerGas) {
        if (estimationLoading || !estimationError) return;
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
        setLatestSubmitError(null);
        setSubmitLoading(true);
        if (cancelledRef?.current) return;
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
      submitDisabled,
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
      setTab,
      cancelledRef,
      estimationLoading,
      estimationError
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
        submitDisabled={submitDisabled}
      />
    </FormProvider>
  );
};
