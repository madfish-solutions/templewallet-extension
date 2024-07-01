import React, { memo, useCallback, useMemo } from 'react';

import { startCase } from 'lodash';

import { FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { ACCOUNT_OR_GROUP_NAME_PATTERN } from 'app/defaults';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { DisplayedGroup } from 'lib/temple/types';

import { AccountsManagementSelectors } from './selectors';

interface RenameWalletModalProps {
  onClose: EmptyFn;
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

  const { register, handleSubmit, errors, formState, onSubmit, setValue } = useTempleBackendActionForm<FormData>(
    renameGroup,
    'name',
    { defaultValues: renameFormInitialValues }
  );
  const submitting = formState.isSubmitting;

  const cleanWalletName = useCallback(() => setValue('name', ''), [setValue]);

  return (
    <ActionModal title={startCase(t('renameWallet'))} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ActionModalBodyContainer>
          <FormField
            ref={register({
              required: t('required'),
              pattern: {
                value: ACCOUNT_OR_GROUP_NAME_PATTERN,
                message: t('accountOrGroupNameInputTitle')
              }
            })}
            label={<T id="walletNameInputLabel" />}
            labelContainerClassName="text-grey-2"
            id="rename-wallet-input"
            type="text"
            name="name"
            placeholder={selectedGroup.name}
            errorCaption={errors.name?.message}
            containerClassName="mb-1.5"
            cleanable
            onClean={cleanWalletName}
            testID={AccountsManagementSelectors.newWalletNameInput}
          />
        </ActionModalBodyContainer>
        <ActionModalButtonsContainer>
          <ActionModalButton
            color="primary-low"
            disabled={submitting}
            onClick={onClose}
            testID={AccountsManagementSelectors.cancelButton}
          >
            <T id="cancel" />
          </ActionModalButton>

          <ActionModalButton
            color="primary"
            type="submit"
            disabled={submitting}
            testID={AccountsManagementSelectors.saveNameButton}
          >
            <T id="save" />
          </ActionModalButton>
        </ActionModalButtonsContainer>
      </form>
    </ActionModal>
  );
});
