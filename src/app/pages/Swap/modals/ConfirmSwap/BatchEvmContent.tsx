import { useEffect, useRef, useState, type FC } from 'react';

import type { LiFiStep } from '@lifi/sdk';
import { FormProvider, useForm } from 'react-hook-form';

import { Tooltip } from 'app/atoms/Tooltip';
import { dispatch, persistor, store, useSelector } from 'app/store';
import { addPendingEvmBatchAction, monitorPendingEvmBatchesAction } from 'app/store/evm/pending-transactions/actions';
import { hasPendingEvmBatch } from 'app/store/evm/pending-transactions/utils';
import type { EvmTxParamsFormData, Tab } from 'app/templates/TransactionTabs/types';
import { toastInfo } from 'app/toaster';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { getAlchemyBatchReviewStep } from 'lib/evm/alchemy/swap';
import { T } from 'lib/i18n';
import { atomsToTokens } from 'lib/temple/helpers';
import { LedgerOperationState } from 'lib/ui';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';

import { getProtocolFeeForRouteStep } from '../../form/EvmSwapForm/utils';
import { formatDuration, getBufferedExecutionDuration } from '../../form/utils';
import { getTokenSlugFromEvmDexTokenAddress } from '../../utils';

import { BaseContent } from './BaseContent';
import { getBatchKey } from './batch-key';
import { getBalancesChanges } from './evm-balances';
import type { EvmContentProps } from './EvmContent';
import { useAlchemySwapBatch } from './hooks/useAlchemySwapBatch';

export const BatchEvmContent: FC<EvmContentProps & { batchSteps: LiFiStep[] }> = ({
  stepReviewData,
  initialInputData,
  batchSteps,
  onClose,
  onStepCompleted,
  cancelledRef,
  submitDisabled,
  onUseLegacyFlow,
  onBatchBusyChange
}) => {
  const { account, inputNetwork, outputNetwork, destinationChainGasTokenAmount } = stepReviewData;
  const accountPkh = account.address as HexString;
  const batchKey = getBatchKey(batchSteps);
  const alreadyPending = useSelector(state => hasPendingEvmBatch(state, accountPkh, inputNetwork.chainId, batchKey));
  const batch = useAlchemySwapBatch({ steps: batchSteps, account: accountPkh, network: inputNetwork });
  const form = useForm<EvmTxParamsFormData>({
    defaultValues: { gasPrice: '', gasLimit: '', nonce: '', data: '', rawTransaction: '' }
  });
  const [tab, setTab] = useState<Tab>('details');
  const [error, setError] = useState<unknown>();
  const [submitting, setSubmitting] = useState(false);
  const retried = useRef(false);
  const getExplorer = useGetEvmActiveBlockExplorer();
  const step = getAlchemyBatchReviewStep(batch.reviewSteps);
  const inputSlug = getTokenSlugFromEvmDexTokenAddress(step.action.fromToken.address);
  const outputSlug = getTokenSlugFromEvmDexTokenAddress(step.action.toToken.address);
  const bridgeData =
    inputNetwork.chainId !== outputNetwork.chainId
      ? {
          inputNetwork,
          outputNetwork,
          executionTime: formatDuration(getBufferedExecutionDuration(step.estimate.executionDuration)),
          protocolFee: getProtocolFeeForRouteStep(step, inputNetwork),
          destinationChainGasTokenAmount
        }
      : undefined;

  useEffect(() => {
    onBatchBusyChange?.(submitting);
    return () => onBatchBusyChange?.(false);
  }, [submitting, onBatchBusyChange]);

  const onSubmit = async (): Promise<void> => {
    if (submitDisabled || alreadyPending || batch.busy || submitting || cancelledRef?.current) return;
    setError(undefined);
    if ((batch.error || error) && tab === 'error') setTab('details');
    if ((batch.error || error) && !batch.submitted) {
      if (retried.current && onUseLegacyFlow) {
        onUseLegacyFlow();
      } else {
        retried.current = true;
        batch.refresh();
      }
      return;
    }
    setSubmitting(true);
    onBatchBusyChange?.(true);
    try {
      const callId = await batch.execute();
      if (!callId) return;
      if (hasPendingEvmBatch(store.getState(), accountPkh, inputNetwork.chainId, batchKey)) return;
      const explorer = getExplorer(inputNetwork.chainId.toString(), Boolean(bridgeData));
      dispatch(
        addPendingEvmBatchAction({
          callId,
          batchKey,
          accountPkh,
          inputNetwork,
          blockExplorerBaseUrl: explorer.url,
          outputTokenSlug: outputSlug,
          outputNetwork,
          initialInputTokenSlug: initialInputData.tokenSlug,
          initialInputNetwork: initialInputData.network,
          statusCheckParams: {
            fromChain: step.action.fromChainId,
            toChain: step.action.toChainId,
            bridge: step.tool,
            provider: 'lifi'
          },
          submittedAt: Date.now()
        })
      );
      dispatch(monitorPendingEvmBatchesAction());
      await persistor.flush();
      toastInfo('Swap submitted', true);
      if (!cancelledRef?.current) onStepCompleted();
    } catch (cause) {
      setError(cause);
      setTab('error');
    } finally {
      setSubmitting(false);
      onBatchBusyChange?.(false);
    }
  };

  return (
    <FormProvider {...form}>
      <BaseContent<EvmTxParamsFormData>
        ledgerApprovalModalState={LedgerOperationState.NotStarted}
        onLedgerModalClose={() => undefined}
        network={inputNetwork}
        nativeAssetSlug={EVM_TOKEN_SLUG}
        selectedTab={tab}
        setSelectedTab={setTab}
        latestSubmitError={error ?? batch.error}
        selectedFeeOption={batch.selectedFeeOption}
        onFeeOptionSelect={batch.selectFeeOption}
        displayedFee={batch.fee}
        displayedFeeOptions={batch.feeOptions}
        minimumReceived={{
          amount: atomsToTokens(step.estimate.toAmountMin, step.action.toToken.decimals).toString(),
          symbol: step.action.toToken.symbol
        }}
        onCancel={onClose}
        onSubmit={onSubmit}
        someBalancesChanges
        filteredBalancesChanges={getBalancesChanges(
          step,
          inputSlug,
          outputSlug,
          outputNetwork,
          destinationChainGasTokenAmount
        )}
        bridgeData={bridgeData}
        submitLoadingOverride={submitting || batch.busy}
        submitDisabled={submitDisabled || alreadyPending}
        readOnlyFees
        retry={batch.expired || batch.submitted}
        evmGasPriceOverride={batch.gasPrice}
        evmAdvancedValues={batch.advancedValues}
        actionsNotice={
          alreadyPending ? (
            <p className="p-1 text-font-description text-grey-1">This swap is already pending.</p>
          ) : batch.delegationRequired ? (
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
      />
    </FormProvider>
  );
};
