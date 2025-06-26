import React, { memo } from 'react';

import { ActionModal, ActionModalButton, ActionModalButtonsContainer, ActionModalProps } from 'app/atoms/action-modal';
import { T } from 'lib/i18n';

import { DialogBody } from './DialogBody';

export interface AlertModalProps extends ActionModalProps {
  description?: ActionModalProps['children'];
  isOpen: boolean;
}

export const AlertModal = memo<AlertModalProps>(({ children, description, isOpen, onClose, ...restProps }) =>
  isOpen ? (
    <ActionModal {...restProps} onClose={onClose}>
      <DialogBody description={description}>{children}</DialogBody>
      <ActionModalButtonsContainer>
        <ActionModalButton color="primary" type="button" onClick={onClose}>
          <T id="okGotIt" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  ) : null
);
