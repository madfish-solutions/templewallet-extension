import React, { FC, memo } from 'react';

import { CrossChainExchange } from 'app/store/cross-chain-send/state';

import { ConfirmCrossChainSendModal } from '../modals/ConfirmCrossChainSend';
import { ConfirmCrossChainReviewData } from '../modals/ConfirmCrossChainSend/types';
import { CrossChainActivityModal } from '../modals/CrossChainActivityModal';
import { CrossChainWarningModal } from '../modals/WarningModal';

interface Props {
  warningOpened: boolean;
  confirmOpened: boolean;
  activityOpened: boolean;
  reviewData?: ConfirmCrossChainReviewData;
  initialExchangeId?: string;
  accountId?: string;
  onWarningClose: EmptyFn;
  onWarningConfirm: EmptyFn;
  onConfirmClose: EmptyFn;
  onConfirmSubmitted: (exchangeId: string) => void;
  onActivityClose: EmptyFn;
  onActivityClick: (exchange: CrossChainExchange) => void;
  onTryAgain: EmptyFn;
}

export const CrossChainSendModals: FC<Props> = memo(
  ({
    warningOpened,
    confirmOpened,
    activityOpened,
    reviewData,
    initialExchangeId,
    accountId,
    onWarningClose,
    onWarningConfirm,
    onConfirmClose,
    onConfirmSubmitted,
    onActivityClose,
    onActivityClick,
    onTryAgain
  }) => (
    <>
      <CrossChainWarningModal opened={warningOpened} onRequestClose={onWarningClose} onConfirm={onWarningConfirm} />
      <ConfirmCrossChainSendModal
        opened={confirmOpened}
        reviewData={reviewData}
        initialExchangeId={initialExchangeId}
        onRequestClose={onConfirmClose}
        onGoBack={onConfirmClose}
        onSubmitted={onConfirmSubmitted}
        onTryAgain={onTryAgain}
      />
      <CrossChainActivityModal
        opened={activityOpened}
        onRequestClose={onActivityClose}
        accountId={accountId}
        onExchangeClick={onActivityClick}
      />
    </>
  )
);
