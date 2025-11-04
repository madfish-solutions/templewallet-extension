import React, { FC, memo, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { PageModal } from 'app/atoms/PageModal';
import { isSwapEvmReviewData, SwapReviewData } from 'app/pages/Swap/form/interfaces';
import { ConfirmationModal } from 'app/templates/ConfirmationModal/ConfirmationModal';
import { t, T } from 'lib/i18n';
import { TezosEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';

import { ConfirmEvmUserAction } from './ConfirmEvmUserAction';
import { useEvmUserActions } from './hooks/useEvmUserActions';
import { TezosContent } from './TezosContent';

interface ConfirmSwapModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: SwapReviewData;
  onReview: SyncFn<SwapReviewData>;
}

export const ConfirmSwapModal: FC<ConfirmSwapModalProps> = ({ opened, onRequestClose, reviewData }) => {
  const {
    userActions,
    currentUserAction,
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
  } = useEvmUserActions(opened, onRequestClose, reviewData);

  const title = useMemo(() => {
    if (!reviewData) return '';

    if (isSwapEvmReviewData(reviewData) && currentUserAction) {
      if (currentUserAction?.value?.type === 'approve') return t('approval');

      return t(isBridgeOperation ? 'bridgePreview' : 'swapPreview');
    }

    return t('swapPreview');
  }, [reviewData, currentUserAction, isBridgeOperation]);

  const titleLeft = useMemo(() => {
    if (!reviewData || !isSwapEvmReviewData(reviewData) || userActions.length < 2) return;

    const currentStep = Math.min(currentActionIndex + 1, userActions.length);

    return <TitleLeftProgress current={currentStep} total={userActions.length} />;
  }, [currentActionIndex, reviewData, userActions.length]);

  return (
    <>
      <PageModal
        title={title}
        titleLeft={titleLeft}
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
              <TezosEstimationDataProvider>
                <TezosContent data={reviewData} onClose={onRequestClose} />
              </TezosEstimationDataProvider>
            ))}
      </PageModal>
      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        onClose={setCancelConfirmClosed}
        onConfirm={performCancel}
        title={<T id="cancelOperationTitle" substitutions={getOperationTitle(isBridgeOperation)} />}
        description={<T id="cancelOperationDescription" substitutions={getOperationTitle(isBridgeOperation, true)} />}
        cancelButtonText={<T id="back" />}
        confirmButtonText={<T id="cancelAnyway" />}
        confirmButtonColor="red"
      />
    </>
  );
};

interface TitleLeftProgressProps {
  current: number;
  total: number;
}

const TitleLeftProgress = memo<TitleLeftProgressProps>(({ current, total }) => (
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
));

const getOperationTitle = (isBridge: boolean, lowercase?: boolean) => {
  const text = t(isBridge ? 'bridge' : 'swap');

  return lowercase ? text.toLowerCase() : text;
};
