import React, { memo } from 'react';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { T } from 'lib/i18n';

interface RemoveAssetModalProps {
  onClose: EmptyFn;
  onDelete: EmptyFn;
}

export const DeleteAssetModal = memo<RemoveAssetModalProps>(({ onClose, onDelete }) => (
  <ActionModal title="Delete Asset" onClose={onClose} className="w-88 rounded-lg">
    <ActionModalBodyContainer>
      <p className="text-font-description text-grey-1 w-full text-center">
        Are you sure you want to delete this asset?
      </p>
    </ActionModalBodyContainer>
    <ActionModalButtonsContainer>
      <ActionModalButton className="bg-primary-low text-primary" onClick={onClose}>
        <T id="cancel" />
      </ActionModalButton>

      <ActionModalButton className="bg-error text-white" onClick={onDelete}>
        <T id="delete" />
      </ActionModalButton>
    </ActionModalButtonsContainer>
  </ActionModal>
));
