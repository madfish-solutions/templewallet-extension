import React, { FC, useCallback, useState } from 'react';

import type { ActionCreatorWithOptionalPayload } from '@reduxjs/toolkit';

import { PageModal } from 'app/atoms/PageModal';
import { ReviewData } from 'app/pages/Send/form/interfaces';
import { dispatch } from 'app/store';
import { setEvmTransferBeingWatchedAction } from 'app/store/evm/pending-transactions/actions';
import { setTezosTransactionBeingWatchedAction } from 'app/store/tezos/pending-transactions/actions';
import {
  EvmEstimationDataProvider,
  TezosEstimationDataProvider,
  isEvmReviewData
} from 'lib/temple/front/estimation-data-providers';
import { TxHash } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EvmContent } from './EvmContent';
import { EvmOperationStatusContent, TezosOperationStatusContent } from './operation-status-content';
import { TezosContent } from './TezosContent';
import { ReviewDataForChain, TxData } from './types';

interface ConfirmSendModalHOCInput<T extends TempleChainKind> {
  DataProvider: React.FC<{ children: React.ReactNode }>;
  ConfirmContent: React.FC<{ data: ReviewDataForChain<T>; onClose: EmptyFn; onSuccess: SyncFn<TxData<T>> }>;
  OperationStatusContent: React.FC<{ data: ReviewDataForChain<T>; onClose: EmptyFn; txData: TxData<T> }>;
  setTransferBeingWatchedAction: ActionCreatorWithOptionalPayload<TxHash<T> | undefined, string>;
}

interface ConfirmSendModalHOCProps<T extends TempleChainKind> {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: ReviewDataForChain<T>;
}

const ConfirmSendModalHOC = <T extends TempleChainKind>({
  DataProvider,
  ConfirmContent,
  OperationStatusContent,
  setTransferBeingWatchedAction
}: ConfirmSendModalHOCInput<T>) => {
  const ChainConfirmSendModal: FC<ConfirmSendModalHOCProps<T>> = ({ opened, onRequestClose, reviewData }) => {
    const [txData, setTxData] = useState<TxData<T>>();

    const closeModal = useCallback(() => {
      dispatch(setTransferBeingWatchedAction(undefined));
      setTxData(undefined);
      onRequestClose();
    }, [onRequestClose]);

    const handleSuccess = useCallback((txData: TxData<T>) => {
      setTxData(txData);
      dispatch(setTransferBeingWatchedAction(txData.txHash));
    }, []);

    return (
      <PageModal
        title={txData ? 'Send' : 'Confirm Send'}
        titleLeft={null}
        titleRight={<div />}
        opened={opened}
        onRequestClose={closeModal}
        shouldChangeBottomShift={false}
      >
        {reviewData ? (
          <DataProvider>
            {txData ? (
              <OperationStatusContent data={reviewData} onClose={closeModal} txData={txData} />
            ) : (
              <ConfirmContent data={reviewData} onClose={closeModal} onSuccess={handleSuccess} />
            )}
          </DataProvider>
        ) : null}
      </PageModal>
    );
  };

  return ChainConfirmSendModal;
};

const TezosConfirmSendModal = ConfirmSendModalHOC<TempleChainKind.Tezos>({
  DataProvider: TezosEstimationDataProvider,
  ConfirmContent: TezosContent,
  OperationStatusContent: TezosOperationStatusContent,
  setTransferBeingWatchedAction: setTezosTransactionBeingWatchedAction
});

const EvmConfirmSendModal = ConfirmSendModalHOC<TempleChainKind.EVM>({
  DataProvider: EvmEstimationDataProvider,
  ConfirmContent: EvmContent,
  OperationStatusContent: EvmOperationStatusContent,
  setTransferBeingWatchedAction: setEvmTransferBeingWatchedAction
});

interface ConfirmSendModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  reviewData?: ReviewData;
}

export const ConfirmSendModal: FC<ConfirmSendModalProps> = ({ reviewData, ...restProps }) =>
  !reviewData || isEvmReviewData(reviewData) ? (
    <EvmConfirmSendModal {...restProps} reviewData={reviewData} />
  ) : (
    <TezosConfirmSendModal {...restProps} reviewData={reviewData} />
  );
