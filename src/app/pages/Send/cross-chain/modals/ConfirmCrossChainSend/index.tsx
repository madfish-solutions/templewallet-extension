import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { useCrossChainExchangeSelector } from 'app/store/cross-chain-send/selectors';
import { TID, t } from 'lib/i18n';

import { CompletedContent } from './CompletedContent';
import { FailedContent } from './FailedContent';
import { PreviewContent } from './PreviewContent';
import { ProcessingContent } from './ProcessingContent';
import { ConfirmCrossChainReviewData, ConfirmCrossChainStep, phaseToConfirmStep } from './types';

interface Props {
  opened: boolean;
  reviewData?: ConfirmCrossChainReviewData;
  onRequestClose: EmptyFn;
  onGoBack?: EmptyFn;
  onTryAgain?: (data: ConfirmCrossChainReviewData) => void;
  /** Dev/activity-entry: pre-seed an exchange id so the modal opens straight to the matching status step */
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
  initialExchangeId,
  devForceReservationError
}) => {
  const [exchangeId, setExchangeId] = useState<string | undefined>(initialExchangeId);
  const closeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!opened) return;
    setExchangeId(initialExchangeId);
  }, [opened, initialExchangeId]);

  useEffect(
    () => () => {
      if (closeResetTimerRef.current) clearTimeout(closeResetTimerRef.current);
    },
    []
  );

  const exchange = useCrossChainExchangeSelector(exchangeId);
  const step = exchange ? phaseToConfirmStep(exchange.phase) : ConfirmCrossChainStep.Preview;

  const handleSubmitted = useCallback((id: string) => setExchangeId(id), []);

  const handleClose = useCallback(() => {
    onRequestClose();
    if (closeResetTimerRef.current) clearTimeout(closeResetTimerRef.current);
    // Defer reset so modal close anim (~300ms) completes before the content reverts to Preview.
    closeResetTimerRef.current = setTimeout(() => {
      setExchangeId(undefined);
      closeResetTimerRef.current = null;
    }, 300);
  }, [onRequestClose]);

  const handleTryAgain = useCallback(() => {
    if (reviewData && onTryAgain) {
      onRequestClose();
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
          onSubmitted={handleSubmitted}
          onCancel={onGoBack ?? handleClose}
          devForceReservationError={devForceReservationError}
        />
      )}
      {exchangeId && step === ConfirmCrossChainStep.Processing && (
        <ProcessingContent exchangeId={exchangeId} onClose={handleClose} />
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
