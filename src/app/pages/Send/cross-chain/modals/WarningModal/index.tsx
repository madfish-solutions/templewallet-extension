import React, { FC, useState } from 'react';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { Checkbox } from 'app/atoms/Checkbox';
import { CROSS_CHAIN_WARNING_DISMISSED_STORAGE_KEY } from 'lib/cross-chain';
import { T, t } from 'lib/i18n';
import { useLocalStorage } from 'lib/ui/local-storage';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
  onConfirm: EmptyFn;
}

export const CrossChainWarningModal: FC<Props> = ({ opened, onRequestClose, onConfirm }) => {
  const [, setDismissed] = useLocalStorage<boolean>(CROSS_CHAIN_WARNING_DISMISSED_STORAGE_KEY, false);
  const [dontShow, setDontShow] = useState(false);

  if (!opened) return null;

  const handleConfirm = () => {
    if (dontShow) setDismissed(true);
    onConfirm();
  };

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
          <Checkbox checked={dontShow} onChange={checked => setDontShow(checked)} />
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
