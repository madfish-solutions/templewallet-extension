import React, { FC, useMemo, useState, useEffect, useCallback, memo } from 'react';

import { getStepTransaction, LiFiStep } from '@lifi/sdk';
import retry from 'async-retry';

import { PageModal } from 'app/atoms/PageModal';
import { AddAssetProvider } from 'app/ConfirmPage/add-asset/context';
import { AddChainDataProvider } from 'app/ConfirmPage/add-chain/context';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { getProtocolFeeForRouteStep } from 'app/pages/Swap/form/EvmSwapForm/utils';
import { EvmReviewData, isSwapEvmReviewData, SwapReviewData, TezosReviewData } from 'app/pages/Swap/form/interfaces';
import ApproveModal from 'app/pages/Swap/modals/ApproveModal';
import { useEvmAllowances } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { ConfirmationModal } from 'app/templates/ConfirmationModal/ConfirmationModal';
import { toastError } from 'app/toaster';
import { T } from 'lib/i18n';
import { TezosEstimationDataProvider, EvmEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { atomsToTokens } from 'lib/temple/helpers';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmContent } from './EvmContent';
import { TezosContent } from './TezosContent';

interface ConfirmSwapModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: SwapReviewData;
  onReview: (data: SwapReviewData) => void;
}

export const ConfirmSwapModal: FC<ConfirmSwapModalProps> = ({ opened, onRequestClose, reviewData }) => {
  const { allowanceSufficient } = useEvmAllowances(
    reviewData && isSwapEvmReviewData(reviewData) ? reviewData.swapRoute.steps : []
  );
  const totalApprovalsNeeded = allowanceSufficient.filter(sufficient => !sufficient).length;

  const evmSteps = useMemo(() => {
    if (!reviewData || !isSwapEvmReviewData(reviewData)) return [];
    return reviewData.swapRoute.steps;
  }, [reviewData]);

  const needsApprovalByIndex = useMemo(
    () => (reviewData && isSwapEvmReviewData(reviewData) ? allowanceSufficient.map(sufficient => !sufficient) : []),
    [reviewData, allowanceSufficient]
  );

  const userActions = useMemo(
    () =>
      evmSteps.flatMap((step, stepIndex) =>
        needsApprovalByIndex[stepIndex]
          ? [
              { type: 'approval' as const, stepIndex, routeStep: step },
              { type: 'execute' as const, stepIndex, routeStep: step }
            ]
          : [{ type: 'execute' as const, stepIndex, routeStep: step }]
      ),
    [evmSteps, needsApprovalByIndex]
  );

  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const firstExecutionActionIndex = useMemo(() => {
    const index = userActions.findIndex(a => a.type === 'execute');
    return index === -1 ? 0 : index;
  }, [userActions]);

  useEffect(() => {
    setCurrentActionIndex(0);
  }, [opened, reviewData]);

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
    if (isSwapEvmReviewData(reviewData) && userActions.length > 0) {
      const current = userActions[Math.min(currentActionIndex, userActions.length - 1)];
      if (current.type === 'approval') return 'Approve';
      const isBridge = current.routeStep.action.fromChainId !== current.routeStep.action.toChainId;
      return isBridge ? 'Bridge Preview' : 'Swap Preview';
    }
    return 'Swap Preview';
  }, [reviewData, userActions, currentActionIndex]);

  const totalSteps = useMemo(() => {
    if (!reviewData || !isSwapEvmReviewData(reviewData)) return 0;
    return totalApprovalsNeeded + reviewData.swapRoute.steps.length;
  }, [reviewData, totalApprovalsNeeded]);

  const onStepCompleted = useCallback(() => {
    if (currentActionIndex < userActions.length - 1) {
      setCurrentActionIndex(i => i + 1);
    } else {
      onRequestClose();
      if (reviewData && isSwapEvmReviewData(reviewData)) {
        reviewData.handleResetForm();
      }
    }
  }, [currentActionIndex, onRequestClose, reviewData, userActions.length]);

  const performCancel = useCallback(() => {
    setIsCancelConfirmOpen(false);
    onRequestClose();
    if (reviewData && isSwapEvmReviewData(reviewData)) {
      reviewData.handleResetForm();
    }
  }, [onRequestClose, reviewData]);

  const handleRequestClose = useCallback(() => {
    if (reviewData && isSwapEvmReviewData(reviewData)) {
      // Show warning only after the first execution action
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
          reviewData && isSwapEvmReviewData(reviewData) && totalSteps > 1
            ? titleLeftProgress(Math.min(currentActionIndex + 1, totalSteps), totalSteps)
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
                  performCancel={performCancel}
                />
              )
            : renderTezosContent(reviewData))}
      </PageModal>
      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={performCancel}
        title={
          <T
            id="cancelOperationTitle"
            substitutions={
              userActions[Math.min(currentActionIndex, userActions.length - 1)]?.routeStep.action.fromChainId !==
              userActions[Math.min(currentActionIndex, userActions.length - 1)]?.routeStep.action.toChainId
                ? 'Bridge'
                : 'Swap'
            }
          />
        }
        description={
          <T
            id="cancelOperationDescription"
            substitutions={
              userActions[Math.min(currentActionIndex, userActions.length - 1)]?.routeStep.action.fromChainId !==
              userActions[Math.min(currentActionIndex, userActions.length - 1)]?.routeStep.action.toChainId
                ? 'bridge'
                : 'swap'
            }
          />
        }
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
    performCancel
  }: {
    routeStep: LiFiStep;
    data: EvmReviewData;
    mode: 'approval' | 'execute';
    onStepCompleted: EmptyFn;
    onRequestClose: EmptyFn;
    performCancel: EmptyFn;
  }) => {
    console.log('routeStep', routeStep);
    const inputNetwork = useEvmChainByChainId(routeStep.action.fromChainId);
    const outputNetwork = useEvmChainByChainId(routeStep.action.toChainId);

    if (!inputNetwork || !outputNetwork) throw new DeadEndBoundaryError();

    const [routeStepWithTransactionRequest, setRouteStepWithTransactionRequest] = useState<LiFiStep | null>(null);

    useEffect(() => {
      setRouteStepWithTransactionRequest(null);
    }, [routeStep, mode]);

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

    useEffect(() => {
      if (mode !== 'execute') return;

      let cancelled = false;

      const run = async () => {
        try {
          await retry(
            async bail => {
              if (cancelled) return bail(new Error('cancelled'));

              const step = await getStepTransaction(routeStep);

              if (cancelled) return bail(new Error('cancelled'));
              setRouteStepWithTransactionRequest(step);
            },
            { retries: 3, minTimeout: 1000 }
          );
        } catch (e: any) {
          console.warn(e);
          if (!cancelled) {
            toastError('Failed to prepare transaction');
            performCancel();
          }
        }
      };

      void run();

      return () => {
        cancelled = true;
      };
    }, [routeStep, mode, performCancel]);

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
          <EvmContent stepReviewData={stepReviewData} onClose={onRequestClose} onStepCompleted={onStepCompleted} />
        )}
      </EvmEstimationDataProvider>
    );
  }
);
