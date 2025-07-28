import React, { FC } from 'react';

import clsx from 'clsx';

import { PageModal } from 'app/atoms/PageModal';
import { AddAssetProvider } from 'app/ConfirmPage/add-asset/context';
import { AddChainDataProvider } from 'app/ConfirmPage/add-chain/context';
import { EvmReviewData, isSwapEvmReviewData, SwapReviewData, TezosReviewData } from 'app/pages/Swap/form/interfaces';
import ApproveModal from 'app/pages/Swap/modals/ApproveModal';
import { TezosEstimationDataProvider, EvmEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';

import { EvmContent } from './EvmContent';
import { TezosContent } from './TezosContent';

interface ConfirmSwapModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: SwapReviewData;
  onReview: (data: SwapReviewData) => void;
}

export const ConfirmSwapModal: FC<ConfirmSwapModalProps> = ({ opened, onRequestClose, reviewData, onReview }) => {
  const renderEvmContent = (data: EvmReviewData) => () =>
    (
      <EvmEstimationDataProvider>
        {data.needsApproval ? (
          <AddChainDataProvider>
            <AddAssetProvider>
              <ApproveModal data={data} onReview={onReview} onClose={onRequestClose} />
            </AddAssetProvider>
          </AddChainDataProvider>
        ) : (
          <EvmContent data={data} onClose={onRequestClose} />
        )}
      </EvmEstimationDataProvider>
    );

  const renderTezosContent = (data: TezosReviewData) => () =>
    (
      <TezosEstimationDataProvider>
        <TezosContent data={data} onClose={onRequestClose} />
      </TezosEstimationDataProvider>
    );

  const titleLeft = (data: EvmReviewData) => {
    return (
      <div className="w-12 mx-auto text-center">
        <div className="text-font-num-bold-14 text-grey-1">{data?.needsApproval ? '1/2' : '2/2'}</div>
        <div className="w-full h-1 bg-lines rounded-full">
          <div className={clsx('h-full bg-black rounded-full', data?.needsApproval ? 'w-1/2' : 'w-full')}></div>
        </div>
      </div>
    );
  };

  return (
    <PageModal
      title={reviewData && isSwapEvmReviewData(reviewData) && reviewData.needsApproval ? 'Approve' : 'Swap Preview'}
      titleLeft={
        reviewData && isSwapEvmReviewData(reviewData) && reviewData?.neededApproval ? titleLeft(reviewData) : undefined
      }
      opened={opened}
      onRequestClose={onRequestClose}
      shouldChangeBottomShift={false}
    >
      {reviewData && (isSwapEvmReviewData(reviewData) ? renderEvmContent(reviewData) : renderTezosContent(reviewData))}
    </PageModal>
  );
};
