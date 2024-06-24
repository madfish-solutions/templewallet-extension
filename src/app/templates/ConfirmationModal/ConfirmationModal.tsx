import React, { FC } from 'react';

import clsx from 'clsx';

import { FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import ModalWithTitle, { ModalWithTitleProps } from 'app/templates/ModalWithTitle';
import { T } from 'lib/i18n';

import { ConfirmatonModalSelectors } from './ConfirmatonModal.selectors';

export interface ConfirmationModalProps extends ModalWithTitleProps {
  onConfirm: () => void;
  comfirmButtonText?: string;
  stretchButtons?: boolean;
}

const ConfirmationModal: FC<ConfirmationModalProps> = props => {
  const { onRequestClose, children, onConfirm, comfirmButtonText, stretchButtons, ...restProps } = props;

  return (
    <ModalWithTitle {...restProps} onRequestClose={onRequestClose}>
      <>
        <div className="mb-8">{children}</div>

        <div className={clsx('flex', stretchButtons ? 'gap-x-4 h-10' : 'justify-end gap-x-3')}>
          <FormSecondaryButton
            small={!stretchButtons}
            unsetHeight={stretchButtons}
            className={stretchButtons ? 'flex-grow' : undefined}
            onClick={onRequestClose}
            testID={ConfirmatonModalSelectors.cancelButton}
          >
            <T id="cancel" />
          </FormSecondaryButton>

          <FormSubmitButton
            small={!stretchButtons}
            unsetHeight={stretchButtons}
            className={clsx(stretchButtons ? 'flex-grow' : 'capitalize')}
            type="button"
            onClick={onConfirm}
            testID={ConfirmatonModalSelectors.okButton}
          >
            {comfirmButtonText ?? <T id="ok" />}
          </FormSubmitButton>
        </div>
      </>
    </ModalWithTitle>
  );
};

export default ConfirmationModal;
