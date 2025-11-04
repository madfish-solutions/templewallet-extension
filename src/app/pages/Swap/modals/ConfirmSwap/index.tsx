import React, { FC, useMemo, useState, useEffect, useCallback, memo, useRef } from 'react';

import { LiFiStep } from '@lifi/sdk';
import { isDefined } from '@rnw-community/shared';
import retry from 'async-retry';

import { PageModal } from 'app/atoms/PageModal';
import { AddAssetProvider } from 'app/ConfirmPage/add-asset/context';
import { AddChainDataProvider } from 'app/ConfirmPage/add-chain/context';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { getProtocolFeeForRouteStep } from 'app/pages/Swap/form/EvmSwapForm/utils';
import { isSwapEvmReviewData, SwapReviewData, TezosReviewData } from 'app/pages/Swap/form/interfaces';
import ApproveModal from 'app/pages/Swap/modals/ApproveModal';
import { useEvmAllowances } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { ConfirmationModal } from 'app/templates/ConfirmationModal/ConfirmationModal';
import { toastError } from 'app/toaster';
import { getEvmStepTransaction } from 'lib/apis/temple/endpoints/evm';
import { t, T } from 'lib/i18n';
import { TezosEstimationDataProvider, EvmEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { atomsToTokens } from 'lib/temple/helpers';
import { AccountForChain } from 'temple/accounts';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EvmContent } from './EvmContent';
import { usePrefetchEvmStepTransactions } from './hooks/usePrefetchEvmStepTransactions';
import { TezosContent } from './TezosContent';

type UserActionType = 'approve' | 'execute';

interface UserAction {
  type: UserActionType;
  stepIndex: number;
  routeStep: LiFiStep;
}

interface ConfirmSwapModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: SwapReviewData;
  onReview: SyncFn<SwapReviewData>;
}

export const ConfirmSwapModal: FC<ConfirmSwapModalProps> = ({ opened, onRequestClose, reviewData }) => {
  const { allowanceSufficient, loading: allowancesLoading } = useEvmAllowances(
    reviewData && isSwapEvmReviewData(reviewData) ? reviewData.swapRoute.steps : []
  );

  const evmSteps = useMemo(() => {
    if (!reviewData || !isSwapEvmReviewData(reviewData)) return [];
    return reviewData.swapRoute.steps;
  }, [reviewData]);

  const [userActions, setUserActions] = useState<Array<UserAction>>([]);
  const [actionsInitialized, setActionsInitialized] = useState(false);

  useEffect(() => {
    if (actionsInitialized) return;
    if (!reviewData || !isSwapEvmReviewData(reviewData)) return;
    if (allowancesLoading) return;
    if (allowanceSufficient.length !== evmSteps.length) return;

    const needsApprovalByIndex = allowanceSufficient.map(sufficient => !sufficient);
    const actions = evmSteps.flatMap<UserAction>((step, stepIndex) =>
      needsApprovalByIndex[stepIndex]
        ? [
            { type: 'approve', stepIndex, routeStep: step },
            { type: 'execute', stepIndex, routeStep: step }
          ]
        : [{ type: 'execute', stepIndex, routeStep: step }]
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

  const { progressionBlocked } = usePrefetchEvmStepTransactions({
    opened,
    actionsInitialized,
    steps: evmSteps,
    senderAddress,
    cancelledRef
  });

  const firstExecutionActionIndex = useMemo(() => {
    const index = userActions.findIndex(a => a.type === 'execute');
    return index === -1 ? 0 : index;
  }, [userActions]);

  const lastExecuteActionIndex = useMemo(() => userActions.findLastIndex(a => a?.type === 'execute'), [userActions]);

  useEffect(() => {
    setCurrentActionIndex(0);
    cancelledRef.current = false;
    setActionsInitialized(false);
    setUserActions([]);
  }, [opened, reviewData]);

  const currentUserAction = useMemo(() => {
    if (userActions.length <= 0) return { index: 0, value: undefined };

    const clampedIndex = Math.min(currentActionIndex, userActions.length - 1);

    return { index: clampedIndex, value: userActions[clampedIndex] };
  }, [currentActionIndex, userActions]);

  const skipStatusWait = useMemo(
    () => currentUserAction?.value?.type === 'execute' && currentUserAction.index === lastExecuteActionIndex,
    [currentUserAction, lastExecuteActionIndex]
  );

  const isBridgeOperation = useMemo(() => {
    const action = currentUserAction?.value?.routeStep.action;

    return action?.fromChainId !== action?.toChainId;
  }, [currentUserAction]);

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
      if (currentUserAction?.value?.type === 'approve') return t('approval');
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
          (() =>
            isSwapEvmReviewData(reviewData) ? (
              isDefined(currentUserAction.value) ? (
                <ConfirmEvmUserAction
                  userAction={currentUserAction.value}
                  account={reviewData.account}
                  onStepCompleted={onStepCompleted}
                  onRequestClose={handleRequestClose}
                  cancelledRef={cancelledRef}
                  skipStatusWait={skipStatusWait}
                  submitDisabled={progressionBlocked}
                />
              ) : (
                <></>
              )
            ) : (
              renderTezosContent(reviewData)()
            ))}
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

interface ConfirmEvmUserActionProps {
  userAction: UserAction;
  account: AccountForChain<TempleChainKind.EVM>;
  onStepCompleted: EmptyFn;
  onRequestClose: EmptyFn;
  cancelledRef?: React.MutableRefObject<boolean>;
  skipStatusWait?: boolean;
  submitDisabled?: boolean;
}

const ConfirmEvmUserAction = memo<ConfirmEvmUserActionProps>(
  ({ userAction, account, onStepCompleted, onRequestClose, cancelledRef, skipStatusWait, submitDisabled }) => {
    const { type, routeStep } = userAction;

    const inputNetwork = useEvmChainByChainId(routeStep.action.fromChainId);
    const outputNetwork = useEvmChainByChainId(routeStep.action.toChainId);

    if (!inputNetwork || !outputNetwork) throw new DeadEndBoundaryError();

    const [routeStepWithTransactionRequest, setRouteStepWithTransactionRequest] = useState<LiFiStep | null>(null);

    const stepReviewData = useMemo(() => {
      const base = {
        account,
        inputNetwork,
        outputNetwork,
        protocolFee: getProtocolFeeForRouteStep(routeStep, inputNetwork),
        minimumReceived: {
          amount: atomsToTokens(routeStep.estimate.toAmountMin, routeStep.action.toToken.decimals).toString(),
          symbol: routeStep.action.toToken.symbol
        }
      } as const;

      if (type === 'execute') {
        const safeExecuteStep = routeStepWithTransactionRequest ?? { ...routeStep, transactionRequest: undefined };
        return { ...base, routeStep: safeExecuteStep };
      }

      return { ...base, routeStep };
    }, [account, inputNetwork, type, outputNetwork, routeStep, routeStepWithTransactionRequest]);

    useEffect(() => {
      if (type !== 'execute') return;
      let cancelled = false;

      const run = async () => {
        try {
          await retry(
            async () => {
              if (cancelled || cancelledRef?.current) return;

              const step = await getEvmStepTransaction(routeStep);

              if (cancelled || cancelledRef?.current) return;
              setRouteStepWithTransactionRequest(step);
            },
            { retries: 3, minTimeout: 2000, factor: 1 }
          );
        } catch (e: any) {
          console.warn(e);
          if (!cancelled && !cancelledRef?.current) {
            toastError('Failed to prepare transaction');
          }
        }
      };

      void run();

      return () => {
        cancelled = true;
      };
    }, [cancelledRef, type, routeStep]);

    return (
      <EvmEstimationDataProvider>
        {type === 'approve' ? (
          <AddChainDataProvider>
            <AddAssetProvider>
              <ApproveModal
                stepReviewData={stepReviewData}
                onClose={onRequestClose}
                onStepCompleted={onStepCompleted}
                submitDisabled={submitDisabled}
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
            submitDisabled={submitDisabled}
          />
        )}
      </EvmEstimationDataProvider>
    );
  }
);
