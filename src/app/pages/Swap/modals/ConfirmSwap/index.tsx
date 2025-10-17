import React, { FC, useMemo, useState, useEffect, useCallback, memo, useRef } from 'react';

import { LiFiStep } from '@lifi/sdk';

import { PageModal } from 'app/atoms/PageModal';
import { AddAssetProvider } from 'app/ConfirmPage/add-asset/context';
import { AddChainDataProvider } from 'app/ConfirmPage/add-chain/context';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { getProtocolFeeForRouteStep } from 'app/pages/Swap/form/EvmSwapForm/utils';
import { EvmReviewData, isSwapEvmReviewData, SwapReviewData, TezosReviewData } from 'app/pages/Swap/form/interfaces';
import ApproveModal from 'app/pages/Swap/modals/ApproveModal';
import { useEvmAllowances } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { ConfirmationModal } from 'app/templates/ConfirmationModal/ConfirmationModal';
import { t, T } from 'lib/i18n';
import { TezosEstimationDataProvider, EvmEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { atomsToTokens } from 'lib/temple/helpers';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmContent } from './EvmContent';
import { usePrefetchEvmStepTransactions } from './hooks/usePrefetchEvmStepTransactions';
import { TezosContent } from './TezosContent';

interface ConfirmSwapModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: SwapReviewData;
  onReview: (data: SwapReviewData) => void;
}

export const ConfirmSwapModal: FC<ConfirmSwapModalProps> = ({ opened, onRequestClose, reviewData }) => {
  const { allowanceSufficient, loading: allowancesLoading } = useEvmAllowances(
    reviewData && isSwapEvmReviewData(reviewData) ? reviewData.swapRoute.steps : []
  );

  const evmSteps = useMemo(() => {
    if (!reviewData || !isSwapEvmReviewData(reviewData)) return [];
    return reviewData.swapRoute.steps;
  }, [reviewData]);

  const [userActions, setUserActions] = useState<
    Array<{ type: 'approval' | 'execute'; stepIndex: number; routeStep: LiFiStep }>
  >([]);
  const [actionsInitialized, setActionsInitialized] = useState(false);

  useEffect(() => {
    if (actionsInitialized) return;
    if (!reviewData || !isSwapEvmReviewData(reviewData)) return;
    if (allowancesLoading) return;
    if (allowanceSufficient.length !== evmSteps.length) return;

    const needsApprovalByIndex = allowanceSufficient.map(sufficient => !sufficient);
    const actions = evmSteps.flatMap((step, stepIndex) =>
      needsApprovalByIndex[stepIndex]
        ? [
            { type: 'approval' as const, stepIndex, routeStep: step },
            { type: 'execute' as const, stepIndex, routeStep: step }
          ]
        : [{ type: 'execute' as const, stepIndex, routeStep: step }]
    );

    setUserActions(actions);
    setActionsInitialized(true);
  }, [actionsInitialized, reviewData, evmSteps, allowanceSufficient, allowancesLoading]);

  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const cancelledRef = useRef(false);

  const senderAddress = useMemo(
    () => (reviewData && isSwapEvmReviewData(reviewData) ? (reviewData.account.address as HexString) : undefined),
    [reviewData]
  );

  const { prefetchedStepsByIndex, progressionBlocked } = usePrefetchEvmStepTransactions({
    opened,
    actionsInitialized,
    steps: evmSteps,
    senderAddress,
    cancelledRef,
    onRequestClose
  });

  const firstExecutionActionIndex = useMemo(() => {
    const index = userActions.findIndex(a => a.type === 'execute');
    return index === -1 ? 0 : index;
  }, [userActions]);

  const lastExecuteActionIndex = useMemo(() => {
    for (let i = userActions.length - 1; i >= 0; i--) {
      if (userActions[i]?.type === 'execute') return i;
    }
    return -1;
  }, [userActions]);

  useEffect(() => {
    setCurrentActionIndex(0);
    cancelledRef.current = false;
    setActionsInitialized(false);
    setUserActions([]);
  }, [opened, reviewData]);

  const currentUserAction = useMemo(
    () => (userActions.length > 0 ? userActions[Math.min(currentActionIndex, userActions.length - 1)] : undefined),
    [userActions, currentActionIndex]
  );
  const isBridgeOperation = useMemo(
    () =>
      Boolean(
        currentUserAction &&
          currentUserAction.routeStep.action.fromChainId !== currentUserAction.routeStep.action.toChainId
      ),
    [currentUserAction]
  );
  const operationTitleSubst = isBridgeOperation ? 'Bridge' : 'Swap';
  const operationDescSubst = isBridgeOperation ? 'bridge' : 'swap';

  const renderTezosContent = (data: TezosReviewData) => () =>
    (
      <TezosEstimationDataProvider>
        <TezosContent data={data} onClose={onRequestClose} />
      </TezosEstimationDataProvider>
    );

  const titleLeftProgress = (current: number, total: number) => (
    <div className="w-12 mx-auto text-center">
      <div className="text-font-num-bold-14 text-grey-1">
        {current}/{total}
      </div>
      <div className="w-full h-1 bg-lines rounded-full">
        <div
          className="h-full bg-black rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, (current / total) * 100))}%` }}
        ></div>
      </div>
    </div>
  );

  const title = useMemo(() => {
    if (!reviewData) return '';
    if (isSwapEvmReviewData(reviewData) && currentUserAction) {
      if (currentUserAction.type === 'approval') return t('approve');
      return isBridgeOperation ? t('bridgePreview') : t('swapPreview');
    }
    return t('swapPreview');
  }, [reviewData, currentUserAction, isBridgeOperation]);

  const onStepCompleted = useCallback(() => {
    if (progressionBlocked) {
      return;
    }
    if (currentActionIndex < userActions.length - 1) {
      setCurrentActionIndex(i => i + 1);
    } else {
      onRequestClose();
      if (reviewData && isSwapEvmReviewData(reviewData)) {
        reviewData.handleResetForm();
      }
    }
  }, [currentActionIndex, onRequestClose, reviewData, userActions.length, progressionBlocked]);

  const performCancel = useCallback(() => {
    cancelledRef.current = true;
    setIsCancelConfirmOpen(false);
    onRequestClose();
    if (reviewData && isSwapEvmReviewData(reviewData)) {
      reviewData.handleResetForm();
    }
  }, [onRequestClose, reviewData]);

  const handleRequestClose = useCallback(() => {
    if (reviewData && isSwapEvmReviewData(reviewData)) {
      if (currentActionIndex > firstExecutionActionIndex) {
        setIsCancelConfirmOpen(true);
        return;
      }
    }
    performCancel();
  }, [currentActionIndex, performCancel, reviewData, firstExecutionActionIndex]);

  return (
    <>
      <PageModal
        title={title}
        titleLeft={
          reviewData && isSwapEvmReviewData(reviewData) && userActions.length > 1
            ? titleLeftProgress(Math.min(currentActionIndex + 1, userActions.length), userActions.length)
            : undefined
        }
        opened={opened}
        onRequestClose={handleRequestClose}
        shouldChangeBottomShift={false}
      >
        {reviewData &&
          (isSwapEvmReviewData(reviewData)
            ? userActions.length > 0 && (
                <ConfirmStepEvmContent
                  routeStep={userActions[Math.min(currentActionIndex, userActions.length - 1)].routeStep}
                  data={reviewData}
                  mode={userActions[Math.min(currentActionIndex, userActions.length - 1)].type}
                  onStepCompleted={onStepCompleted}
                  onRequestClose={handleRequestClose}
                  cancelledRef={cancelledRef}
                  skipStatusWait={
                    userActions.length > 0 &&
                    userActions[Math.min(currentActionIndex, userActions.length - 1)].type === 'execute' &&
                    Math.min(currentActionIndex, userActions.length - 1) === lastExecuteActionIndex
                  }
                  prefetchedStepTx={
                    prefetchedStepsByIndex[userActions[Math.min(currentActionIndex, userActions.length - 1)].stepIndex]
                  }
                />
              )
            : renderTezosContent(reviewData))}
      </PageModal>
      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={performCancel}
        title={<T id="cancelOperationTitle" substitutions={operationTitleSubst} />}
        description={<T id="cancelOperationDescription" substitutions={operationDescSubst} />}
        cancelButtonText={<T id="back" />}
        confirmButtonText={<T id="cancelAnyway" />}
        confirmButtonColor="red"
      />
    </>
  );
};

const ConfirmStepEvmContent = memo(
  ({
    routeStep,
    data,
    mode,
    onStepCompleted,
    onRequestClose,
    cancelledRef,
    prefetchedStepTx,
    skipStatusWait
  }: {
    routeStep: LiFiStep;
    data: EvmReviewData;
    mode: 'approval' | 'execute';
    onStepCompleted: EmptyFn;
    onRequestClose: EmptyFn;
    cancelledRef?: React.MutableRefObject<boolean>;
    prefetchedStepTx?: LiFiStep;
    skipStatusWait?: boolean;
  }) => {
    const inputNetwork = useEvmChainByChainId(routeStep.action.fromChainId);
    const outputNetwork = useEvmChainByChainId(routeStep.action.toChainId);

    if (!inputNetwork || !outputNetwork) throw new DeadEndBoundaryError();

    const [routeStepWithTransactionRequest, setRouteStepWithTransactionRequest] = useState<LiFiStep | null>(
      prefetchedStepTx ?? null
    );

    useEffect(() => {
      setRouteStepWithTransactionRequest(prefetchedStepTx ?? null);
    }, [routeStep, mode, prefetchedStepTx]);

    const stepReviewData = useMemo(
      () => ({
        account: data.account,
        inputNetwork,
        outputNetwork,
        protocolFee: getProtocolFeeForRouteStep(routeStep, inputNetwork),
        minimumReceived: {
          amount: atomsToTokens(routeStep.estimate.toAmountMin, routeStep.action.toToken.decimals).toString(),
          symbol: routeStep.action.toToken.symbol
        },
        routeStep: mode === 'execute' ? routeStepWithTransactionRequest ?? routeStep : routeStep
      }),
      [data.account, inputNetwork, outputNetwork, routeStep, routeStepWithTransactionRequest, mode]
    );

    return (
      <EvmEstimationDataProvider>
        {mode === 'approval' ? (
          <AddChainDataProvider>
            <AddAssetProvider>
              <ApproveModal
                stepReviewData={stepReviewData}
                onClose={onRequestClose}
                onStepCompleted={onStepCompleted}
              />
            </AddAssetProvider>
          </AddChainDataProvider>
        ) : (
          <EvmContent
            stepReviewData={stepReviewData}
            onClose={onRequestClose}
            onStepCompleted={onStepCompleted}
            cancelledRef={cancelledRef}
            skipStatusWait={skipStatusWait}
          />
        )}
      </EvmEstimationDataProvider>
    );
  }
);
