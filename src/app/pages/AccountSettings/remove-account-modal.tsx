import React, { memo, useCallback, useMemo } from 'react';

import { Controller } from 'react-hook-form-v7';

import { Alert, FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { DEFAULT_PASSWORD_INPUT_PLACEHOLDER } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { StoredAccount, TempleAccountType } from 'lib/temple/types';
import { useHDGroups } from 'temple/front';

import { AccountSettingsSelectors } from './selectors';

interface RemoveAccountModalProps {
  account: StoredAccount;
  onClose: EmptyFn;
}

interface FormData {
  password: string;
}

export const RemoveAccountModal = memo<RemoveAccountModalProps>(({ account, onClose }) => {
  const { removeAccount } = useTempleClient();
  const hdGroups = useHDGroups();
  const shouldPreventDeletion = useMemo(() => {
    if (account.type !== TempleAccountType.HD) return false;
    return account.hdIndex === 0 && hdGroups[0]?.id === account.walletId;
  }, [account, hdGroups]);

  const deleteAccount = useCallback(
    async ({ password }: FormData) => {
      await removeAccount(account.id, password);
      onClose();
    },
    [account.id, onClose, removeAccount]
  );
  const { control, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    deleteAccount,
    'password'
  );
  const submitting = formState.isSubmitting;

  return (
    <ActionModal title={`Remove ${account.name}?`} hasCloseButton={false} onClose={onClose}>
      {shouldPreventDeletion ? (
        <>
          <ActionModalBodyContainer>
            <Alert
              type="error"
              title={<T id="cannotBeRemoved" />}
              description={
                <p>
                  <T id="accountsToRemoveConstraint" />
                </p>
              }
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary-low"
              onClick={onClose}
              type="button"
              testID={AccountSettingsSelectors.cancelButton}
            >
              <T id="cancel" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <ActionModalBodyContainer>
            <Controller
              name="password"
              control={control}
              rules={{ required: t('required') }}
              render={({ field }) => (
                <FormField
                  {...field}
                  id="removewallet-secret-password"
                  type="password"
                  placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
                  errorCaption={errors.password?.message}
                  reserveSpaceForError={false}
                  containerClassName="mb-1"
                  testID={AccountSettingsSelectors.passwordInput}
                />
              )}
            />
            <span className="text-font-description text-grey-1 w-full text-center">
              This will remove the account from this list and delete all data associated with it.
            </span>
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary-low"
              disabled={submitting}
              onClick={onClose}
              type="button"
              testID={AccountSettingsSelectors.cancelButton}
            >
              <T id="cancel" />
            </ActionModalButton>

            <ActionModalButton
              color="red"
              disabled={submitting}
              type="submit"
              testID={AccountSettingsSelectors.confirmRemoveAccountButton}
            >
              <T id="remove" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      )}
    </ActionModal>
  );
});
