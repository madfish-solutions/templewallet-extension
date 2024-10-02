import React, { FC } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { EvmReviewData, ReviewData } from 'app/pages/Send/form/interfaces';
import { TempleChainKind } from 'temple/types';

import { EvmContent } from './EvmContent';
import { TezosContent } from './TezosContent';

interface ConfirmSendModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: ReviewData;
}

export const ConfirmSendModal: FC<ConfirmSendModalProps> = ({ opened, onRequestClose, reviewData }) => (
  <PageModal title="Confirm Send" opened={opened} onRequestClose={onRequestClose}>
    {reviewData ? (
      isEvmReviewData(reviewData) ? (
        <EvmContent data={reviewData} onClose={onRequestClose} />
      ) : (
        <TezosContent data={reviewData} onClose={onRequestClose} />
      )
    ) : null}
  </PageModal>
);

const isEvmReviewData = (data: ReviewData): data is EvmReviewData => data.network.kind === TempleChainKind.EVM;
