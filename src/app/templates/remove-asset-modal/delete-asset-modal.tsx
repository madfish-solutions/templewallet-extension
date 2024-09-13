import React, { memo, useCallback } from 'react';

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

export const DeleteAssetModal = memo<RemoveAssetModalProps>(({ onClose, onDelete }) => {
  const handleDelete = useCallback(() => {
    onDelete();
    onClose();
  }, [onClose, onDelete]);

  return (
    <ActionModal title="Delete Asset" onClose={onClose} className="w-88 rounded-lg">
      <ActionModalBodyContainer>
        <p className="text-font-description text-grey-1 w-full text-center">
          Are you sure you want to delete this asset?
        </p>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer>
        <ActionModalButton color="red" onClick={handleDelete}>
          <T id="delete" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
});
