import React, { FC } from 'react';

import { FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import ModalWithTitle, { ModalWithTitleProps } from 'app/templates/ModalWithTitle';
import { T } from 'lib/i18n';

import { ConfirmatonModalSelectors } from './ConfirmatonModal.selectors';

export interface ConfirmationModalProps extends ModalWithTitleProps {
  onConfirm: () => void;
}

const ConfirmationModal: FC<ConfirmationModalProps> = props => {
  const { onRequestClose, children, onConfirm, ...restProps } = props;

  return (
    <ModalWithTitle {...restProps} onRequestClose={onRequestClose}>
      <div className="mb-8">{children}</div>

      <div className="flex justify-end">
        <FormSecondaryButton
          small
          className="mr-3"
          onClick={onRequestClose}
          testID={ConfirmatonModalSelectors.cancelButton}
        >
          <T id="cancel" />
        </FormSecondaryButton>

        <FormSubmitButton small type="button" onClick={onConfirm} testID={ConfirmatonModalSelectors.okButton}>
          <T id="ok" />
        </FormSubmitButton>
      </div>
    </ModalWithTitle>
  );
};

export default ConfirmationModal;
