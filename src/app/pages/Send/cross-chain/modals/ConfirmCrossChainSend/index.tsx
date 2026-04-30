import React, { FC, useCallback, useEffect, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { TID, t } from 'lib/i18n';

import { CompletedContent } from './CompletedContent';
import { FailedContent } from './FailedContent';
import { PreviewContent } from './PreviewContent';
import { ProcessingContent } from './ProcessingContent';
import { ConfirmCrossChainReviewData, ConfirmCrossChainStep } from './types';

interface Props {
  opened: boolean;
  reviewData?: ConfirmCrossChainReviewData;
  onRequestClose: EmptyFn;
  onGoBack?: EmptyFn;
  onTryAgain?: (data: ConfirmCrossChainReviewData) => void;
  /** Dev-only: jump straight to a non-Preview step using a pre-seeded exchange id */
  initialStep?: ConfirmCrossChainStep;
  initialExchangeId?: string;
  /** Dev-only: force the eager Exolix reservation to fail so the failure UI can be inspected. */
  devForceReservationError?: boolean;
}

const STEP_TITLE_ID: Record<ConfirmCrossChainStep, TID> = {
  [ConfirmCrossChainStep.Preview]: 'sendPreview',
  [ConfirmCrossChainStep.Processing]: 'processingStepTitle',
  [ConfirmCrossChainStep.Completed]: 'send',
  [ConfirmCrossChainStep.Failed]: 'send'
};

export const ConfirmCrossChainSendModal: FC<Props> = ({
  opened,
  reviewData,
  onRequestClose,
  onGoBack,
  onTryAgain,
  initialStep,
  initialExchangeId,
  devForceReservationError
}) => {
  const [step, setStep] = useState<ConfirmCrossChainStep>(initialStep ?? ConfirmCrossChainStep.Preview);
  const [exchangeId, setExchangeId] = useState<string | undefined>(initialExchangeId);

  useEffect(() => {
    if (!opened) return;
    setStep(initialStep ?? ConfirmCrossChainStep.Preview);
    setExchangeId(initialExchangeId);
  }, [opened, initialStep, initialExchangeId]);

  const handleStepChange = useCallback((nextStep: ConfirmCrossChainStep, id: string) => {
    setExchangeId(id);
    setStep(nextStep);
  }, []);

  const handleClose = useCallback(() => {
    onRequestClose();
    // defer reset so modal close anim completes first
    setTimeout(() => {
      setStep(ConfirmCrossChainStep.Preview);
      setExchangeId(undefined);
    }, 300);
  }, [onRequestClose]);

  const handleTryAgain = useCallback(() => {
    if (reviewData && onTryAgain) {
      onRequestClose();
      setStep(ConfirmCrossChainStep.Preview);
      setExchangeId(undefined);
      onTryAgain(reviewData);
    }
  }, [reviewData, onTryAgain, onRequestClose]);

  return (
    <PageModal
      title={t(STEP_TITLE_ID[step])}
      opened={opened}
      onRequestClose={handleClose}
      onGoBack={step === ConfirmCrossChainStep.Preview ? onGoBack : undefined}
      titleRight={<div />}
      shouldChangeBottomShift={false}
    >
      {reviewData && step === ConfirmCrossChainStep.Preview && (
        <PreviewContent
          data={reviewData}
          onStepChange={handleStepChange}
          onCancel={onGoBack ?? handleClose}
          devForceReservationError={devForceReservationError}
        />
      )}
      {exchangeId && step === ConfirmCrossChainStep.Processing && (
        <ProcessingContent exchangeId={exchangeId} onStepChange={handleStepChange} onClose={handleClose} />
      )}
      {exchangeId && step === ConfirmCrossChainStep.Completed && (
        <CompletedContent exchangeId={exchangeId} onClose={handleClose} />
      )}
      {exchangeId && step === ConfirmCrossChainStep.Failed && (
        <FailedContent exchangeId={exchangeId} onClose={handleClose} onTryAgain={handleTryAgain} />
      )}
    </PageModal>
  );
};
