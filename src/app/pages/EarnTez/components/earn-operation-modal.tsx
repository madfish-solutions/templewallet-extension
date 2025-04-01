import React, { ComponentType, useCallback, useMemo, useState } from 'react';

import { CLOSE_ANIMATION_TIMEOUT, PageModal } from 'app/atoms/PageModal';
import { toastSuccess } from 'app/toaster';
import { TezosNetworkEssentials } from 'temple/networks';

import { TezosEarnReviewDataBase } from '../types';
import { useBlockExplorerUrl } from '../utils';

export interface EarnOperationModalProps<D, R extends TezosEarnReviewDataBase> {
  inputDataStepTitle: ReactChildren;
  confirmStepTitle: ReactChildren;
  successToastText: string;
  network: TezosNetworkEssentials;
  showTxHash?: boolean;
  SuspenseLoader?: ComponentType<{ isInputDataStep: boolean }>;
  InputDataContent: ComponentType<{ onSubmit: SyncFn<D> }>;
  ConfirmContent: ComponentType<{ reviewData: R | undefined; onCancel: EmptyFn }>;
  makeReviewData: (data: D, onSuccess: SyncFn<string>) => R;
  onClose: EmptyFn;
}

enum EarnOperationModalStep {
  InputData = 'input-data',
  Confirm = 'confirm'
}

interface EarnOperationModalStateBase {
  step: EarnOperationModalStep;
}

interface InputDataState extends EarnOperationModalStateBase {
  step: EarnOperationModalStep.InputData;
}

interface ConfirmState<D> extends EarnOperationModalStateBase {
  step: EarnOperationModalStep.Confirm;
  data: D;
}

type EarnOperationModalState<D> = InputDataState | ConfirmState<D>;

export const EarnOperationModal = <D, R extends TezosEarnReviewDataBase>({
  inputDataStepTitle,
  confirmStepTitle,
  successToastText,
  showTxHash = true,
  network,
  SuspenseLoader,
  ConfirmContent,
  InputDataContent,
  makeReviewData,
  onClose
}: EarnOperationModalProps<D, R>) => {
  const [modalState, setModalState] = useState<EarnOperationModalState<D>>({
    step: EarnOperationModalStep.InputData
  });
  const isInputDataStep = modalState.step === EarnOperationModalStep.InputData;
  const explorerBaseUrl = useBlockExplorerUrl(network);

  const goToInputData = useCallback(() => setModalState({ step: EarnOperationModalStep.InputData }), []);
  const handleDataSubmit = useCallback((data: D) => setModalState({ step: EarnOperationModalStep.Confirm, data }), []);
  const handleSuccess = useCallback(
    (hash: string) => {
      setTimeout(
        () =>
          toastSuccess(
            successToastText,
            true,
            explorerBaseUrl && showTxHash ? { hash, explorerBaseUrl: explorerBaseUrl + '/' } : undefined
          ),
        CLOSE_ANIMATION_TIMEOUT * 2
      );
      onClose();
    },
    [explorerBaseUrl, onClose, showTxHash, successToastText]
  );

  const reviewData = useMemo(
    () =>
      modalState.step === EarnOperationModalStep.Confirm ? makeReviewData(modalState.data, handleSuccess) : undefined,
    [handleSuccess, makeReviewData, modalState]
  );

  return (
    <PageModal
      title={isInputDataStep ? inputDataStepTitle : confirmStepTitle}
      opened
      suspenseLoader={SuspenseLoader ? <SuspenseLoader isInputDataStep={isInputDataStep} /> : undefined}
      titleRight={isInputDataStep ? undefined : <div />}
      onGoBack={isInputDataStep ? undefined : goToInputData}
      onRequestClose={onClose}
    >
      {modalState.step === EarnOperationModalStep.InputData ? (
        <InputDataContent onSubmit={handleDataSubmit} />
      ) : (
        <ConfirmContent reviewData={reviewData} onCancel={goToInputData} />
      )}
    </PageModal>
  );
};
