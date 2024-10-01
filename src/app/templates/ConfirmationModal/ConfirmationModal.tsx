import React, { ReactNode, memo } from 'react';

import { ActionModal, ActionModalButton, ActionModalButtonsContainer, ActionModalProps } from 'app/atoms/action-modal';
import { T } from 'lib/i18n';
import { StyledButtonColor } from 'lib/ui/button-like-styles';

import { DialogBody } from '../DialogBody';

import { ConfirmatonModalSelectors } from './ConfirmatonModal.selectors';

export interface ConfirmationModalProps extends ActionModalProps {
  description?: ActionModalProps['children'];
  isOpen: boolean;
  confirmButtonText?: ReactNode;
  confirmButtonColor?: StyledButtonColor;
  onConfirm: EmptyFn;
}

const ConfirmationModal = memo<ConfirmationModalProps>(
  ({
    onClose,
    isOpen,
    children,
    description,
    onConfirm,
    confirmButtonText,
    confirmButtonColor = 'primary',
    ...restProps
  }) =>
    isOpen ? (
      <ActionModal {...restProps} onClose={onClose}>
        <DialogBody description={description}>{children}</DialogBody>

        <ActionModalButtonsContainer>
          <ActionModalButton
            color="primary-low"
            onClick={onClose}
            type="button"
            testID={ConfirmatonModalSelectors.cancelButton}
          >
            <T id="cancel" />
          </ActionModalButton>

          <ActionModalButton
            color={confirmButtonColor}
            type="button"
            testID={ConfirmatonModalSelectors.okButton}
            onClick={onConfirm}
          >
            {confirmButtonText ?? <T id="ok" />}
          </ActionModalButton>
        </ActionModalButtonsContainer>
      </ActionModal>
    ) : null
);

export default ConfirmationModal;
