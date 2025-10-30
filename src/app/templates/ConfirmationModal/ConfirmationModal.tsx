import React, { ReactNode, memo } from 'react';

import { ActionModal, ActionModalButton, ActionModalButtonsContainer, ActionModalProps } from 'app/atoms/action-modal';
import { T } from 'lib/i18n';
import { StyledButtonColor } from 'lib/ui/use-styled-button-or-link-props';

import { DialogBody } from '../DialogBody';

import { ConfirmatonModalSelectors } from './ConfirmatonModal.selectors';

export interface ConfirmationModalProps extends ActionModalProps {
  description?: ActionModalProps['children'];
  isOpen: boolean;
  cancelButtonText?: ReactNode;
  confirmButtonText?: ReactNode;
  confirmButtonColor?: StyledButtonColor;
  hasCancelButton?: boolean;
  onConfirm: EmptyFn;
}

export const ConfirmationModal = memo<ConfirmationModalProps>(
  ({
    onClose,
    isOpen,
    children,
    description,
    onConfirm,
    cancelButtonText,
    confirmButtonText,
    confirmButtonColor = 'primary',
    hasCancelButton = true,
    ...restProps
  }) =>
    isOpen ? (
      <ActionModal {...restProps} onClose={onClose}>
        <DialogBody description={description}>{children}</DialogBody>

        <ActionModalButtonsContainer>
          {hasCancelButton && (
            <ActionModalButton
              color="primary-low"
              onClick={onClose}
              type="button"
              testID={ConfirmatonModalSelectors.cancelButton}
            >
              {cancelButtonText ?? <T id="cancel" />}
            </ActionModalButton>
          )}

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
