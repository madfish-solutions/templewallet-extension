import React, { memo, useCallback, useMemo } from 'react';

import { FormField } from 'app/atoms';
import { ACCOUNT_OR_GROUP_NAME_PATTERN } from 'app/defaults';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { DisplayedGroup } from 'lib/temple/types';

import { ActionModal } from './action-modal';
import { ActionModalBodyContainer } from './action-modal-body-container';
import { ActionModalButton } from './action-modal-button';
import { ActionModalButtonsContainer } from './action-modal-buttons-container';
import { useTempleBackendActionForm } from './use-temple-backend-action-form';

interface RenameWalletModalProps {
  onClose: () => void;
  selectedGroup: DisplayedGroup;
}

interface FormData {
  name: string;
}

export const RenameWalletModal = memo<RenameWalletModalProps>(({ onClose, selectedGroup }) => {
  const { editHdGroupName } = useTempleClient();
  const renameFormInitialValues = useMemo(() => ({ name: selectedGroup.name }), [selectedGroup]);

  const renameGroup = useCallback(
    async ({ name }: FormData) => {
      await editHdGroupName(selectedGroup.id, name);
      onClose();
    },
    [editHdGroupName, onClose, selectedGroup.id]
  );

  const { register, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    renameGroup,
    'name',
    { defaultValues: renameFormInitialValues }
  );
  const submitting = formState.isSubmitting;

  return (
    <ActionModal title="Rename Wallet" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ActionModalBodyContainer>
          <FormField
            ref={register({
              required: t('required'),
              pattern: {
                value: ACCOUNT_OR_GROUP_NAME_PATTERN,
                message: t('accountNameInputTitle')
              }
            })}
            label={t('walletNameInputLabel')}
            id="rename-wallet-input"
            type="text"
            name="name"
            placeholder={selectedGroup.name}
            errorCaption={errors.name?.message}
            containerClassName="mb-1"
          />
        </ActionModalBodyContainer>
        <ActionModalButtonsContainer>
          <ActionModalButton
            className="bg-orange-200 text-orange-20"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <T id="cancel" />
          </ActionModalButton>

          <ActionModalButton className="bg-orange-20 text-white" disabled={submitting} type="submit">
            <T id="save" />
          </ActionModalButton>
        </ActionModalButtonsContainer>
      </form>
    </ActionModal>
  );
});
