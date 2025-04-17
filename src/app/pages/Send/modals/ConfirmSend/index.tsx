import React, { FC } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { ReviewData } from 'app/pages/Send/form/interfaces';
import {
  EvmEstimationDataProvider,
  TezosEstimationDataProvider,
  isEvmReviewData
} from 'lib/temple/front/estimation-data-providers';

import { EvmContent } from './EvmContent';
import { TezosContent } from './TezosContent';

interface ConfirmSendModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: ReviewData;
}

export const ConfirmSendModal: FC<ConfirmSendModalProps> = ({ opened, onRequestClose, reviewData }) => (
  <PageModal
    title="Confirm Send"
    titleLeft={null}
    titleRight={<div />}
    opened={opened}
    onRequestClose={onRequestClose}
    shouldChangeBottomShift={false}
  >
    {reviewData ? (
      isEvmReviewData(reviewData) ? (
        <EvmEstimationDataProvider>
          <EvmContent data={reviewData} onClose={onRequestClose} />
        </EvmEstimationDataProvider>
      ) : (
        <TezosEstimationDataProvider>
          <TezosContent data={reviewData} onClose={onRequestClose} />
        </TezosEstimationDataProvider>
      )
    ) : null}
  </PageModal>
);
