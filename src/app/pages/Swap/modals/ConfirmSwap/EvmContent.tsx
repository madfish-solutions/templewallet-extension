import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { LiFiStep, StatusResponse } from '@lifi/sdk';
import retry from 'async-retry';
import BigNumber from 'bignumber.js';
import { FormProvider } from 'react-hook-form-v7';
import { TransactionRequest, isAddress } from 'viem';

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
import { fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { EvmAssetStandard } from 'lib/evm/types';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens, tokensToAtoms } from 'lib/temple/helpers';
import { ETHERLINK_MAINNET_CHAIN_ID, TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { delay } from 'lib/utils';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { getViemPublicClient } from 'temple/evm';
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
import { InitialInputData } from './types';
import { mapLiFiTxToEvmEstimationData, parseTxRequestToViem } from './utils';

interface EvmContentProps {
  stepReviewData: EvmStepReviewData;
  initialInputData: InitialInputData;
  onClose: EmptyFn;
  onStepCompleted: EmptyFn;
  cancelledRef?: React.MutableRefObject<boolean>;
  skipStatusWait?: boolean;
  submitDisabled?: boolean;
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
  const { fromAmount, fromToken, toToken, txDestination: txTo } = getCommonStepProps(routeStep);

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const inputTokenSlug = useMemo(() => getTokenSlugFromEvmDexTokenAddress(fromToken.address), [fromToken.address]);

  const outputTokenSlug = useMemo(() => getTokenSlugFromEvmDexTokenAddress(toToken.address), [toToken.address]);

  const { sendEvmTransaction } = useTempleClient();
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, inputNetwork);
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);
  const [stepFinalized, setStepFinalized] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    setStepFinalized(false);
  }, [routeStep]);

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
    toFilled: isValidTxTo && !stepFinalized && !submitLoading && !cancelledRef?.current,
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

  const balancesChanges = useMemo(() => {
    let input: AssetsAmounts;
    let output: AssetsAmounts;
    if (isLifiStep(routeStep)) {
      input = {
        [inputTokenSlug]: { atomicAmount: new BigNumber(-routeStep.estimate.fromAmount), isNft: false }
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
        [inputTokenSlug]: { atomicAmount: new BigNumber(-routeStep.fromAmount), isNft: false }
      };
      output = {
        [outputTokenSlug]: { atomicAmount: new BigNumber(routeStep.toAmount), isNft: false }
      };
    }

    return [input, output];
  }, [
    destinationChainGasTokenAmount,
    outputNetwork?.currency.address,
    outputNetwork?.currency.decimals,
    inputTokenSlug,
    routeStep,
    outputTokenSlug
  ]);

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

  const executeRouteStep = useCallback(
    async (step: LiFiStep | Route3EvmRoute, { gasPrice, gasLimit, nonce }: Partial<EvmTxParamsFormData>) => {
      if (cancelledRef?.current) return;

      let txParams: TransactionRequest | null = null;
      if (isLifiStep(step)) {
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
          ...(gasPrice ? { gasPrice: BigInt(gasPrice) } : {}),
          ...(gasLimit ? { gasLimit: BigInt(gasLimit) } : {}),
          ...(nonce ? { nonce: Number(nonce) } : {})
        };
      }

      if (!txParams) {
        console.error(`Failed to parse transactionRequest for step ${isLifiStep(step) ? step.tool : '3Route'}`);
        return;
      }

      const txHash = await sendEvmTransaction(accountPkh, inputNetwork, txParams);

      const blockExplorer = getActiveBlockExplorer(inputNetwork.chainId.toString(), !!bridgeData);
      showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);

      const statusCheckParams = isLifiStep(step)
        ? { fromChain: step.action.fromChainId, toChain: step.action.toChainId, bridge: step.tool }
        : { fromChain: ETHERLINK_MAINNET_CHAIN_ID, toChain: ETHERLINK_MAINNET_CHAIN_ID };

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
            statusCheckParams
          })
        );

        dispatch(monitorPendingSwapsAction());

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
            const balance = await fetchEvmRawBalance(
              outputNetwork,
              outputTokenSlug,
              accountPkh,
              EvmAssetStandard.ERC20
            );

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
    },
    [
      cancelledRef,
      sendEvmTransaction,
      accountPkh,
      inputNetwork,
      getActiveBlockExplorer,
      bridgeData,
      skipStatusWait,
      onStepCompleted,
      outputTokenSlug,
      outputNetwork,
      initialInputData
    ]
  );

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
      if (submitDisabled) return;
      if (formState.isSubmitting) return;

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
        onSubmitError(err);
      } finally {
        setSubmitLoading(false);
      }
    },
    [
      submitDisabled,
      formState.isSubmitting,
      getFeesPerGas,
      providerEstimationData,
      routeStep,
      isLedgerAccount,
      setLedgerApprovalModalState,
      executeRouteStep,
      onSubmitError,
      cancelledRef,
      estimationLoading,
      estimationError,
      assertCustomFeesPerGasNotTooLow
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
