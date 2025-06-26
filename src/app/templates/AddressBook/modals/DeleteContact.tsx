import React, { memo, useCallback } from 'react';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { T } from 'lib/i18n';
import { useContactsActions } from 'lib/temple/front';
import { TempleContact } from 'lib/temple/types';

interface Props {
  contact: TempleContact;
  onClose: EmptyFn;
  onDelete: EmptyFn;
}

export const DeleteContactModal = memo<Props>(({ contact, onClose, onDelete }) => {
  const { removeContact } = useContactsActions();

  const handleDelete = useCallback(async () => {
    await removeContact(contact.address);
    onDelete();
  }, [contact, onDelete, removeContact]);

  return (
    <ActionModal title={`Delete ${contact.name}?`} hasCloseButton={false}>
      <ActionModalBodyContainer className="items-center pt-3">
        <p className="text-grey-1 text-font-description text-center">
          <T id="deleteContactActionDescription" />
        </p>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer className="pb-4">
        <ActionModalButton color="primary-low" onClick={onClose}>
          <T id="cancel" />
        </ActionModalButton>

        <ActionModalButton color="red" onClick={handleDelete}>
          <T id="delete" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
});
