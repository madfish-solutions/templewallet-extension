import React, { memo, useCallback, useMemo } from 'react';

import { Controller } from 'react-hook-form';

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
import { StoredAccount } from 'lib/temple/types';

import { AccountSettingsSelectors } from './selectors';

interface EditAccountNameModalProps {
  account: StoredAccount;
  onClose: EmptyFn;
}

interface FormData {
  name: string;
}

export const EditAccountNameModal = memo<EditAccountNameModalProps>(({ account, onClose }) => {
  const { editAccountName } = useTempleClient();
  const renameFormInitialValues = useMemo(() => ({ name: account.name }), [account]);

  const renameAccount = useCallback(
    async ({ name }: FormData) => {
      await editAccountName(account.id, name);
      onClose();
    },
    [account.id, editAccountName, onClose]
  );

  const { control, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    renameAccount,
    'name',
    { defaultValues: renameFormInitialValues }
  );
  const submitting = formState.isSubmitting;

  return (
    <ActionModal title={t('editAccountName')} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ActionModalBodyContainer>
          <Controller
            name="name"
            control={control}
            rules={{
              required: t('required'),
              pattern: {
                value: ACCOUNT_OR_GROUP_NAME_PATTERN,
                message: t('accountOrGroupNameInputTitle')
              }
            }}
            render={({ field }) => (
              <FormField
                {...field}
                label={t('accountNameInputLabel')}
                labelContainerClassName="text-grey-2"
                id="rename-account-input"
                type="text"
                placeholder={account.name}
                errorCaption={errors.name?.message}
                reserveSpaceForError={false}
                containerClassName="mb-1"
                testID={AccountSettingsSelectors.accountNameInput}
              />
            )}
          />
        </ActionModalBodyContainer>
        <ActionModalButtonsContainer>
          <ActionModalButton
            color="primary"
            disabled={submitting}
            type="submit"
            testID={AccountSettingsSelectors.saveAccountNameButton}
          >
            <T id="save" />
          </ActionModalButton>
        </ActionModalButtonsContainer>
      </form>
    </ActionModal>
  );
});
