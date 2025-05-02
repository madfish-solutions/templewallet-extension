import React, { FC } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { TezosEstimationDataProvider, isEvmReviewData } from 'lib/temple/front/estimation-data-providers';

import { TezosReviewData } from '../../form/interfaces';

import { TezosContent } from './TezosContent';

interface ConfirmSendModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: TezosReviewData;
}

export const ConfirmSwapModal: FC<ConfirmSendModalProps> = ({ opened, onRequestClose, reviewData }) => (
  <PageModal
    title="Swap Preview"
    titleLeft={null}
    titleRight={<div />}
    opened={opened}
    onRequestClose={onRequestClose}
    shouldChangeBottomShift={false}
  >
    {reviewData && !isEvmReviewData(reviewData)
      ? () => (
          <TezosEstimationDataProvider>
            <TezosContent data={reviewData} onClose={onRequestClose} />
          </TezosEstimationDataProvider>
        )
      : null}
  </PageModal>
);
