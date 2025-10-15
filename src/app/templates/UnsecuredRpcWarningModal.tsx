import React, { memo } from 'react';

import { ActionModal } from 'app/atoms/action-modal/action-modal';
import { ActionModalBodyContainer } from 'app/atoms/action-modal/action-modal-body-container';
import { ActionModalButton } from 'app/atoms/action-modal/action-modal-button';
import { ActionModalButtonsContainer } from 'app/atoms/action-modal/action-modal-buttons-container';
import { T } from 'lib/i18n';

interface UnsecuredRpcWarningModalProps {
  opened: boolean;
  onCancel: EmptyFn;
  onProceed: EmptyFn;
}

export const UnsecuredRpcWarningModal = memo<UnsecuredRpcWarningModalProps>(({ opened, onCancel, onProceed }) =>
  opened ? (
    <ActionModal
      hasCloseButton={false}
      title={
        <span className="text-font-regular-bold">
          <T id="unsecuredRpcEndpoint" />
        </span>
      }
    >
      <ActionModalBodyContainer>
        <p className="text-center text-grey-1 text-font-description py-1">
          <T id="unsecuredRpcWarning" />
        </p>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer>
        <ActionModalButton color="primary-low" onClick={onCancel}>
          <T id="cancel" />
        </ActionModalButton>
        <ActionModalButton color="red" onClick={onProceed}>
          <T id="proceed" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  ) : null
);
