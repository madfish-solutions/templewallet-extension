import React, { FC, RefObject, useEffect, useMemo, useState } from 'react';

import { LiFiStep, StatusResponse } from '@lifi/sdk';
import retry from 'async-retry';
import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form';
import { FeeValuesEIP1559, FeeValuesLegacy, TransactionRequest, isAddress } from 'viem';

import { Tooltip } from 'app/atoms/Tooltip';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { dispatch } from 'app/store';
import { putNewEvmTokenAction } from 'app/store/evm/assets/actions';
import { processLoadedOnchainBalancesAction } from 'app/store/evm/balances/actions';
import { addPendingEvmSwapAction, monitorPendingSwapsAction } from 'app/store/evm/pending-transactions/actions';
import { putEvmTokensMetadataAction } from 'app/store/evm/tokens-metadata/actions';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { toastError } from 'app/toaster';
import { getEvmSwapStatus } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { getAlchemyMaxCost } from 'lib/evm/alchemy/validation';
import { fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { EvmAssetStandard } from 'lib/evm/types';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { ETHERLINK_MAINNET_CHAIN_ID, TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow, LedgerOperationState } from 'lib/ui';
import { useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { delay } from 'lib/utils';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { getViemPublicClient } from 'temple/evm';
import { EvmChain } from 'temple/front';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { AssetsAmounts, TempleChainKind } from 'temple/types';

import {
  EvmStepReviewData,
  Route3EvmRoute,
  getCommonStepProps,
  isLifiStep,
  isRoute3EvmStep
} from '../../form/interfaces';
import { formatDuration, getBufferedExecutionDuration } from '../../form/utils';
import { getTokenSlugFromEvmDexTokenAddress } from '../../utils';

import { BaseContent } from './BaseContent';
import { useAlchemySwapBatch } from './hooks/useAlchemySwapBatch';
import { InitialInputData } from './types';
import { mapLiFiTxToEvmEstimationData, parseTxRequestToViem } from './utils';

interface EvmContentProps {
  stepReviewData: EvmStepReviewData;
  initialInputData: InitialInputData;
  onClose: EmptyFn;
  onStepCompleted: EmptyFn;
  cancelledRef?: RefObject<boolean | null>;
  skipStatusWait?: boolean;
  submitDisabled?: boolean;
  batchSteps?: LiFiStep[];
  onUseLegacyFlow?: EmptyFn;
  onBatchBusyChange?: SyncFn<boolean>;
}

const swapNotConfirmedError = new Error(
  `This transaction wasn’t confirmed because the gas price is to low and didn’t meet network demand. Increase it to \
speed up confirmation and try again.`
);

export const EvmContent: FC<EvmContentProps> = ({
  stepReviewData,
  initialInputData,
  onClose,
  onStepCompleted,
  cancelledRef,
  skipStatusWait,
  submitDisabled,
  batchSteps,
  onUseLegacyFlow,
  onBatchBusyChange
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
  const { fromAmount, fromToken, toToken, txDestination: txTo } = getCommonStepProps(routeStep);

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const inputTokenSlug = getTokenSlugFromEvmDexTokenAddress(fromToken.address);
  const outputTokenSlug = getTokenSlugFromEvmDexTokenAddress(toToken.address);

  const { sendEvmTransaction } = useTempleClient();
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, inputNetwork);
  const batch = useAlchemySwapBatch({
    steps: batchSteps,
    account: accountPkh,
    network: inputNetwork
  });
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);
  const [stepFinalized, setStepFinalized] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [batchRetryAttempted, setBatchRetryAttempted] = useState(false);
  const { guard, preconnectIfNeeded, ledgerPromptProps } = useLedgerWebHidFullViewGuard();

  useEffect(() => {
    onBatchBusyChange?.(Boolean(batchSteps) && submitLoading);
    return () => onBatchBusyChange?.(false);
  }, [batchSteps, submitLoading, onBatchBusyChange]);

  useEffect(() => {
    setStepFinalized(false);
    setBatchRetryAttempted(false);
  }, [routeStep]);

  useEffect(() => {
    if (batchRetryAttempted && !batch.busy && batch.quote && !batch.error) setBatchRetryAttempted(false);
  }, [batchRetryAttempted, batch.busy, batch.error, batch.quote]);

  const { value: balance = ZERO } = useEvmAssetBalance(inputTokenSlug, accountPkh, inputNetwork);

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
    toFilled: !batchSteps && isValidTxTo && !stepFinalized && !submitLoading && !cancelledRef?.current,
    amount: atomsToTokens(fromAmount, fromToken.decimals ?? 0).toFixed(),
    silent: true
  });

  const providerEstimationData = useMemo(() => {
    let gas: bigint | undefined;

    if (!estimationData) return undefined;

    if (isLifiStep(routeStep)) {
      if (!routeStep.transactionRequest) return undefined;

      const mappedLifiEstimation = mapLiFiTxToEvmEstimationData(routeStep.transactionRequest);
      if ('gas' in mappedLifiEstimation) {
        gas = mappedLifiEstimation.gas;
      }
    } else {
      gas = BigInt(routeStep.gas);
    }

    return {
      ...estimationData,
      gas: gas ?? estimationData?.gas,
      nonce: estimationData.nonce
    };
  }, [estimationData, routeStep]);

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
  } = useEvmEstimationForm(providerEstimationData, null, account, inputNetwork.chainId);
  const { formState } = form;
  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const balancesChanges = getBalancesChanges(
    routeStep,
    inputTokenSlug,
    outputTokenSlug,
    outputNetwork,
    destinationChainGasTokenAmount
  );

  const bridgeData = useMemo(() => {
    if (!outputNetwork || !inputNetwork || isRoute3EvmStep(routeStep)) return undefined;
    const info = {
      inputNetwork,
      outputNetwork,
      executionTime: formatDuration(getBufferedExecutionDuration(routeStep.estimate?.executionDuration)),
      protocolFee,
      destinationChainGasTokenAmount: destinationChainGasTokenAmount
    };
    return inputNetwork?.chainId === outputNetwork?.chainId ? undefined : info;
  }, [destinationChainGasTokenAmount, inputNetwork, outputNetwork, protocolFee, routeStep]);

  const executeRouteStep = async (
    step: LiFiStep | Route3EvmRoute,
    { gasPrice, gasLimit, nonce }: Partial<EvmTxParamsFormData>,
    feesPerGas?: FeeValuesEIP1559 | FeeValuesLegacy
  ) => {
    if (cancelledRef?.current) return;

    let txParams: TransactionRequest | null = null;
    if (batchSteps) {
      // The batch executor uses the exact LiFi calls from the prepared quote.
    } else if (isLifiStep(step)) {
      const transactionRequest = step.transactionRequest;
      if (!transactionRequest) {
        console.error(`No transactionRequest found for step ${step.tool}`);
        return;
      }

      txParams = parseTxRequestToViem({
        ...transactionRequest,
        ...(gasPrice ? { gasPrice } : {}),
        ...(gasLimit ? { gasLimit } : {}),
        ...(nonce ? { nonce: Number(nonce) } : {})
      });
    } else {
      const { fromAddress, txDestination, gas, txData, fromAmount, fromToken } = step;
      txParams = {
        from: fromAddress,
        to: txDestination,
        gas: BigInt(gas),
        data: txData,
        value: BigInt(fromToken.address === EVM_ZERO_ADDRESS ? fromAmount : '0'),
        ...(nonce ? { nonce: Number(nonce) } : {})
      };
    }

    if (!txParams && !batchSteps) {
      console.error(`Failed to parse transactionRequest for step ${isLifiStep(step) ? step.tool : '3Route'}`);
      return;
    }

    if (txParams && feesPerGas) {
      delete txParams.gasPrice;
      delete txParams.maxFeePerGas;
      delete txParams.maxPriorityFeePerGas;
      delete txParams.type;
      Object.assign(txParams, feesPerGas);
      txParams.gas = gasLimit ? BigInt(gasLimit) : (txParams.gas ?? providerEstimationData?.gas);
    }

    let requiredNativeBalance: bigint | undefined;
    if (batchSteps) {
      if ((!batch.submitted || batch.replacementReady) && batch.quote)
        requiredNativeBalance = getAlchemyMaxCost(batch.quote);
    } else if (txParams) {
      const gasPrice = txParams.gasPrice ?? txParams.maxFeePerGas;
      if (!txParams.gas || !gasPrice) throw new Error(t('invalidParamsError'));
      requiredNativeBalance = (txParams.value ?? 0n) + txParams.gas * gasPrice;
    }
    if (requiredNativeBalance !== undefined) {
      const nativeBalance = await getViemPublicClient(inputNetwork).getBalance({ address: accountPkh });
      if (nativeBalance < requiredNativeBalance) throw new Error(t('lowGasBalanceError'));
    }

    const txHash = batchSteps ? await batch.execute() : await sendEvmTransaction(accountPkh, inputNetwork, txParams!);
    if (!txHash) return;

    const blockExplorer = getActiveBlockExplorer(inputNetwork.chainId.toString(), !!bridgeData);
    showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);

    const statusCheckParams = isLifiStep(step)
      ? {
          fromChain: step.action.fromChainId,
          toChain: step.action.toChainId,
          bridge: step.tool,
          provider: 'lifi' as const
        }
      : { fromChain: ETHERLINK_MAINNET_CHAIN_ID, toChain: ETHERLINK_MAINNET_CHAIN_ID, provider: '3route' as const };

    if (skipStatusWait) {
      if (cancelledRef?.current) return;

      dispatch(
        addPendingEvmSwapAction({
          txHash,
          accountPkh,
          outputTokenSlug,
          outputNetwork,
          initialInputTokenSlug: initialInputData.tokenSlug,
          initialInputNetwork: initialInputData.network,
          blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.EVM),
          statusCheckParams,
          submittedAt: Date.now()
        })
      );

      dispatch(monitorPendingSwapsAction());

      if (batchSteps) await batch.complete();

      setStepFinalized(true);
      onStepCompleted();
      return;
    }

    let status: StatusResponse['status'];
    if (isLifiStep(step)) {
      do {
        if (cancelledRef?.current) return;
        try {
          const result = await retry(
            async () =>
              await getEvmSwapStatus({
                ...statusCheckParams,
                txHash
              }),
            { retries: 5, minTimeout: 2000 }
          );
          status = result.status;
        } catch {
          throw swapNotConfirmedError;
        }

        await delay(5000);
      } while (status !== 'DONE' && status !== 'FAILED');
    } else {
      const evmToolkit = getViemPublicClient(inputNetwork);
      try {
        status = await retry(
          async () => {
            const result = await evmToolkit.waitForTransactionReceipt({ hash: txHash });
            return result.status === 'success' ? 'DONE' : 'FAILED';
          },
          { retries: 5, minTimeout: 2000 }
        );
      } catch {
        throw swapNotConfirmedError;
      }
    }

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
          const balance = await fetchEvmRawBalance(outputNetwork, outputTokenSlug, accountPkh, EvmAssetStandard.ERC20);

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

          await delay(3000);
        }
      }
    } catch (err) {
      console.warn('Failed to ensure output token is added to wallet', err);
    }

    if (cancelledRef?.current) return;
    setStepFinalized(true);
    onStepCompleted();
  };

  const onSubmitError = (err: unknown) => {
    console.error(err);
    setLatestSubmitError(err);
    setTab('error');
  };

  const onSubmit = async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
    if (submitDisabled) return;
    if (formState.isSubmitting) return;

    if (batchSteps) {
      if (batch.busy) return;
      if ((latestSubmitError || batch.error) && !batch.submitted) {
        if (batchRetryAttempted) {
          onUseLegacyFlow?.();
          return;
        }

        setBatchRetryAttempted(true);
        setLatestSubmitError(null);
        if (tab === 'error') setTab('details');
        batch.refresh();
        return;
      }
      if (!batch.quote || (batch.expired && !batch.submitted)) {
        setLatestSubmitError(null);
        batch.refresh();
        return;
      }
      try {
        setLatestSubmitError(null);
        setSubmitLoading(true);
        await executeRouteStep(routeStep, {});
      } catch (cause) {
        onSubmitError(cause);
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    const feesPerGas = getFeesPerGas(gasPrice);
    if (!providerEstimationData || !feesPerGas) {
      if (!estimationLoading && estimationError) {
        onSubmitError(estimationError);
      }

      return;
    }

    try {
      assertCustomFeesPerGasNotTooLow(feesPerGas);
    } catch (e) {
      onSubmitError(e);

      return;
    }

    try {
      setLatestSubmitError(null);
      setSubmitLoading(true);
      if (cancelledRef?.current) return;
      if (isLedgerAccount) {
        const redirected = await guard(account.type);
        if (redirected) return;
        setLedgerApprovalModalState(LedgerOperationState.InProgress);
        await preconnectIfNeeded(account.type, TempleChainKind.EVM);
        await runConnectedLedgerOperationFlow(
          () =>
            executeRouteStep(
              routeStep,
              {
                gasPrice,
                gasLimit,
                nonce
              },
              feesPerGas
            ),
          setLedgerApprovalModalState,
          true
        );
      } else {
        await executeRouteStep(routeStep, { gasPrice, gasLimit, nonce }, feesPerGas);
      }
    } catch (err: any) {
      onSubmitError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <FormProvider {...form}>
        <BaseContent<EvmTxParamsFormData>
          ledgerApprovalModalState={ledgerApprovalModalState}
          onLedgerModalClose={handleLedgerModalClose}
          network={inputNetwork}
          nativeAssetSlug={EVM_TOKEN_SLUG}
          selectedTab={tab}
          setSelectedTab={setTab}
          latestSubmitError={latestSubmitError || batch.error}
          selectedFeeOption={batchSteps ? batch.selectedFeeOption : selectedFeeOption}
          onFeeOptionSelect={batchSteps ? batch.selectFeeOption : handleFeeOptionSelect}
          displayedFee={batchSteps ? batch.fee : displayedFee}
          displayedFeeOptions={batchSteps ? batch.feeOptions : feeOptions?.displayed}
          minimumReceived={minimumReceived}
          onCancel={onClose}
          cancelDisabled={Boolean(batchSteps) && submitLoading}
          onSubmit={onSubmit}
          someBalancesChanges={true}
          filteredBalancesChanges={balancesChanges}
          bridgeData={bridgeData}
          submitLoadingOverride={submitLoading || batch.busy}
          submitDisabled={submitDisabled}
          readOnlyFees={Boolean(batchSteps)}
          retry={batch.expired || (batch.submitted && !batch.replacementReady)}
          actionsNotice={
            batch.delegationRequired ? (
              <div className="flex items-center justify-center">
                <p className="p-1 text-font-description text-grey-1">
                  <T id="smartWalletFeaturesNotice" />
                </p>
                <Tooltip
                  content={
                    <p className="text-font-description text-white">
                      <T id="smartWalletFeaturesTooltip" />
                    </p>
                  }
                  size={16}
                  className="text-grey-2"
                  wrapperClassName="w-[274px]"
                  appendToBody
                />
              </div>
            ) : undefined
          }
          evmGasPriceOverride={batchSteps ? batch.gasPrice : undefined}
          evmAdvancedValues={batchSteps ? batch.advancedValues : undefined}
        />
      </FormProvider>
      <LedgerFullViewPromptModal {...ledgerPromptProps} />
    </>
  );
};

const getBalancesChanges = (
  routeStep: LiFiStep | Route3EvmRoute,
  inputTokenSlug: string,
  outputTokenSlug: string,
  outputNetwork: EvmChain,
  destinationChainGasTokenAmount?: BigNumber
) => {
  let input: AssetsAmounts;
  let output: AssetsAmounts;
  if (isLifiStep(routeStep)) {
    input = {
      [inputTokenSlug]: { atomicAmount: new BigNumber(routeStep.estimate.fromAmount).negated(), isNft: false }
    };

    output = {
      [outputTokenSlug]: { atomicAmount: new BigNumber(routeStep.estimate.toAmount), isNft: false }
    };

    if (destinationChainGasTokenAmount?.gt(0) && outputNetwork?.currency.address) {
      output[outputNetwork.currency.address] = {
        atomicAmount: tokensToAtoms(destinationChainGasTokenAmount, outputNetwork.currency.decimals),
        isNft: false
      };
    }
  } else {
    input = {
      [inputTokenSlug]: { atomicAmount: new BigNumber(routeStep.fromAmount).negated(), isNft: false }
    };
    output = {
      [outputTokenSlug]: { atomicAmount: new BigNumber(routeStep.toAmount), isNft: false }
    };
  }

  return [input, output];
};
