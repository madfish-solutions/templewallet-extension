import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isLifiStep, isSwapEvmReviewData, SwapReviewData } from 'app/pages/Swap/form/interfaces';
import { getAlchemyWalletConfig } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { AlchemySubmission, getAlchemySubmission } from 'lib/evm/alchemy/submission';
import { canBatchLifiSteps, getAlchemyBatchReviewStep } from 'lib/evm/alchemy/swap';
import type { AlchemyWalletConfig } from 'lib/evm/alchemy/types';
import { TempleAccountType } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';

import { useEvmAllowances } from '../../SwapSelectAsset/hooks';
import { UserAction } from '../types';

import { usePrefetchEvmStepTransactions } from './usePrefetchEvmStepTransactions';

export const useEvmUserActions = (opened: boolean, onRequestClose: EmptyFn, reviewData?: SwapReviewData) => {
  const evmSteps = useMemo(() => {
    if (!reviewData || !isSwapEvmReviewData(reviewData)) return [];

    return 'steps' in reviewData.swapRoute ? reviewData.swapRoute.steps : [reviewData.swapRoute];
  }, [reviewData]);

  const [userActions, setUserActions] = useState<Array<UserAction>>([]);
  const [actionsInitialized, setActionsInitialized] = useState(false);
  const [batchConfig, setBatchConfig] = useState<AlchemyWalletConfig | null>();
  const [legacy, setLegacy] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [recovery, setRecovery] = useState<AlchemySubmission>();
  const [initializationError, setInitializationError] = useState<unknown>();
  const eligible =
    !legacy &&
    batchConfig !== undefined &&
    batchConfig !== null &&
    evmSteps.every(isLifiStep) &&
    canBatchLifiSteps(evmSteps) &&
    batchConfig.chains.includes(evmSteps[0].action.fromChainId);
  const { allowanceSufficient, loading: allowancesLoading } = useEvmAllowances(
    opened && batchConfig !== undefined && !recovery && !eligible ? evmSteps : []
  );

  useEffect(() => {
    if (!opened || !reviewData || !isSwapEvmReviewData(reviewData)) return;
    const controller = new AbortController();
    setBatchConfig(undefined);
    setLegacy(false);
    setRecovery(undefined);
    setInitializationError(undefined);
    const { type } = reviewData.account;
    if (type !== TempleAccountType.HD && type !== TempleAccountType.Imported) {
      setBatchConfig(null);
      return;
    }
    void Promise.all([
      evmSteps.every(isLifiStep) && canBatchLifiSteps(evmSteps)
        ? getAlchemyWalletConfig(controller.signal).catch(() => null)
        : Promise.resolve(null),
      getAlchemySubmission(reviewData.account.address as HexString, reviewData.network.chainId)
    ])
      .then(([config, stored]) => {
        if (controller.signal.aborted) return;
        setRecovery(stored?.result?.status === 'failed' ? undefined : stored);
        setBatchConfig(config);
      })
      .catch(cause => {
        if (!controller.signal.aborted) setInitializationError(cause);
      });
    return () => controller.abort();
  }, [opened, reviewData, evmSteps]);

  useEffect(() => {
    if (actionsInitialized) return;
    if (!reviewData || !isSwapEvmReviewData(reviewData)) return;
    if (batchConfig === undefined) return;
    if (recovery) {
      setUserActions([
        {
          type: 'execute',
          stepIndex: 0,
          routeStep: getAlchemyBatchReviewStep(recovery.steps),
          batchSteps: recovery.steps
        }
      ]);
      setActionsInitialized(true);
      return;
    }
    if (eligible) {
      setUserActions([
        {
          type: 'execute',
          stepIndex: 0,
          routeStep: getAlchemyBatchReviewStep(evmSteps),
          batchSteps: evmSteps
        }
      ]);
      setActionsInitialized(true);
      return;
    }
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
  }, [
    actionsInitialized,
    reviewData,
    evmSteps,
    allowanceSufficient,
    allowancesLoading,
    batchConfig,
    eligible,
    recovery
  ]);

  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isCancelConfirmOpen, setCancelConfirmOpened, setCancelConfirmClosed] = useBooleanState(false);
  const cancelledRef = useRef(false);

  const senderAddress = useMemo(
    () => (reviewData && isSwapEvmReviewData(reviewData) ? (reviewData.account.address as HexString) : undefined),
    [reviewData]
  );

  const { progressionBlocked } = usePrefetchEvmStepTransactions({
    opened,
    actionsInitialized: actionsInitialized && !userActions[0]?.batchSteps,
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
    const routeStep = currentUserAction?.value?.routeStep;

    if (!routeStep || !isLifiStep(routeStep)) return false;

    const { fromChainId, toChainId } = routeStep.action;

    return fromChainId !== toChainId;
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
    // Reset the form only if some route steps have already been executed, so that after a plain
    // cancel the user can review the same swap again with the inputs kept
    if (reviewData && isSwapEvmReviewData(reviewData) && currentActionIndex > firstExecuteAction.index) {
      reviewData.handleResetForm();
    }
  }, [onRequestClose, reviewData, setCancelConfirmClosed, currentActionIndex, firstExecuteAction.index]);

  const handleRequestClose = useCallback(() => {
    if (reviewData && isSwapEvmReviewData(reviewData)) {
      if (currentActionIndex > firstExecuteAction.index) {
        setCancelConfirmOpened();
        return;
      }
    }
    performCancel();
  }, [reviewData, performCancel, currentActionIndex, firstExecuteAction.index, setCancelConfirmOpened]);

  const useLegacyFlow = (): void => {
    if (batchBusy) return;
    setLegacy(true);
    setRecovery(undefined);
    setActionsInitialized(false);
    setUserActions([]);
    setCurrentActionIndex(0);
  };

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
    setCancelConfirmClosed,
    useLegacyFlow,
    setBatchBusy,
    initializationError
  };
};
