import React, { useState } from 'react';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { Checkbox } from 'app/atoms/Checkbox';
import { CROSS_CHAIN_WARNING_DISMISSED_STORAGE_KEY } from 'lib/cross-chain';
import { T, t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
  onConfirm: EmptyFn;
}

export const CrossChainWarningModal: React.FC<Props> = ({ opened, onRequestClose, onConfirm }) => {
  const [, setDismissed] = useStorage<boolean>(CROSS_CHAIN_WARNING_DISMISSED_STORAGE_KEY);
  const [dontShow, setDontShow] = useState(false);

  const handleConfirm = () => {
    if (dontShow) setDismissed(true);
    onConfirm();
  };

  if (!opened) return null;

  return (
    <ActionModal title={t('crossChainWarningTitle')} onClose={onRequestClose}>
      <ActionModalBodyContainer>
        <p className="text-font-description text-grey-1 text-center whitespace-pre-line py-1">
          <T id="crossChainWarningBody" />
        </p>

        <label className="mt-4 flex items-center justify-between p-3 bg-white border-0.5 border-lines rounded-8 cursor-pointer">
          <span className="text-font-medium-bold">
            <T id="dontShowAnymore" />
          </span>
          <Checkbox checked={dontShow} onChange={setDontShow} />
        </label>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer className="pb-4">
        <ActionModalButton color="primary" onClick={handleConfirm}>
          <T id="gotIt" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
};
