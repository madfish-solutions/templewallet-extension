import React, { memo } from 'react';

import { ActionModal } from 'app/atoms/action-modal/action-modal';
import { ActionModalBodyContainer } from 'app/atoms/action-modal/action-modal-body-container';
import { ActionModalButton } from 'app/atoms/action-modal/action-modal-button';
import { ActionModalButtonsContainer } from 'app/atoms/action-modal/action-modal-buttons-container';

interface UnsecuredRpcWarningModalProps {
  opened: boolean;
  onCancel: EmptyFn;
  onProceed: EmptyFn;
}

export const UnsecuredRpcWarningModal = memo<UnsecuredRpcWarningModalProps>(({ opened, onCancel, onProceed }) =>
  opened ? (
    <ActionModal hasCloseButton={false} title={<span className="text-font-regular-bold">Unsecured RPC endpoint</span>}>
      <ActionModalBodyContainer>
        <p className="text-center text-grey-1 text-font-description">
          You’re going to add a custom RPC URL that does not use SSL/TLS encryption. This means your connection may be
          vulnerable to interception or manipulation.
        </p>
        <p className="mt-3 text-center text-grey-1 text-font-description">Proceed only if you trust this endpoint.</p>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer>
        <ActionModalButton color="primary-low" onClick={onCancel}>
          Cancel
        </ActionModalButton>
        <ActionModalButton color="primary" onClick={onProceed}>
          Proceed
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  ) : null
);
