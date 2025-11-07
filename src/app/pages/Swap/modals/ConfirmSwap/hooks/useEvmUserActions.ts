import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isSwapEvmReviewData, SwapReviewData } from 'app/pages/Swap/form/interfaces';
import { useBooleanState } from 'lib/ui/hooks';

import { useEvmAllowances } from '../../SwapSelectAsset/hooks';
import { UserAction } from '../types';

import { usePrefetchEvmStepTransactions } from './usePrefetchEvmStepTransactions';

export const useEvmUserActions = (opened: boolean, onRequestClose: EmptyFn, reviewData?: SwapReviewData) => {
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
  const [isCancelConfirmOpen, setCancelConfirmOpened, setCancelConfirmClosed] = useBooleanState(false);
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

  const firstExecuteAction = useMemo(() => {
    const index = userActions.findIndex(a => a.type === 'execute');
    const fallbackIndex = index === -1 ? 0 : index;

    return { index: fallbackIndex, value: userActions[fallbackIndex] };
  }, [userActions]);

  const skipStatusWait = useMemo(
    () => currentUserAction?.value?.type === 'execute' && currentUserAction.index === lastExecuteActionIndex,
    [currentUserAction, lastExecuteActionIndex]
  );

  const isBridgeOperation = useMemo(() => {
    const action = currentUserAction?.value?.routeStep.action;

    return action?.fromChainId !== action?.toChainId;
  }, [currentUserAction]);

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
    setCancelConfirmClosed();
    onRequestClose();
    if (reviewData && isSwapEvmReviewData(reviewData)) {
      reviewData.handleResetForm();
    }
  }, [onRequestClose, reviewData, setCancelConfirmClosed]);

  const handleRequestClose = useCallback(() => {
    if (reviewData && isSwapEvmReviewData(reviewData)) {
      if (currentActionIndex > firstExecuteAction.index) {
        setCancelConfirmOpened();
        return;
      }
    }
    performCancel();
  }, [reviewData, performCancel, currentActionIndex, firstExecuteAction.index, setCancelConfirmOpened]);

  return {
    userActions,
    currentUserAction,
    firstExecuteAction,
    progressionBlocked,
    skipStatusWait,
    cancelledRef,
    isBridgeOperation,
    currentActionIndex,
    isCancelConfirmOpen,
    performCancel,
    onStepCompleted,
    handleRequestClose,
    setCancelConfirmClosed
  };
};
