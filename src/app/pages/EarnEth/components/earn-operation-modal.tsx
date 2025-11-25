import React, { ComponentType, useCallback, useMemo, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { EvmNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { EthEarnReviewDataBase } from '../types';
import { useBlockExplorerUrl } from '../utils';

export interface EarnOperationModalProps<D, R extends EthEarnReviewDataBase> {
  inputDataStepTitle: ReactChildren;
  confirmStepTitle: ReactChildren;
  successToastText: string;
  network: EvmNetworkEssentials;
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

export const EarnOperationModal = <D, R extends EthEarnReviewDataBase>({
  inputDataStepTitle,
  confirmStepTitle,
  successToastText,
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
      showTxSubmitToastWithDelay(TempleChainKind.EVM, hash, explorerBaseUrl, successToastText);
      onClose();
    },
    [explorerBaseUrl, onClose, successToastText]
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
