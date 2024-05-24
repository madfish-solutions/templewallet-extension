import React, { memo, useCallback, useMemo } from 'react';

import { Alert, FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { StoredAccount, TempleAccountType } from 'lib/temple/types';
import { useAllAccounts } from 'temple/front';

interface RemoveAccountModalProps {
  account: StoredAccount;
  onClose: EmptyFn;
}

interface FormData {
  password: string;
}

export const RemoveAccountModal = memo<RemoveAccountModalProps>(({ account, onClose }) => {
  const { removeAccount } = useTempleClient();
  const allAccounts = useAllAccounts();
  const shouldPreventDeletion = useMemo(
    () =>
      account.type === TempleAccountType.HD &&
      allAccounts.filter(({ type }) => type === TempleAccountType.HD).length === 1,
    [account.type, allAccounts]
  );

  const deleteAccount = useCallback(
    async ({ password }: FormData) => {
      await removeAccount(account.id, password);
      onClose();
    },
    [account.id, onClose, removeAccount]
  );
  const { register, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    deleteAccount,
    'password'
  );
  const submitting = formState.isSubmitting;

  return (
    <ActionModal title={`Remove ${account.name}?`} onClose={onClose}>
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
            <ActionModalButton className="bg-primary-low text-primary" onClick={onClose} type="button">
              <T id="cancel" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <ActionModalBodyContainer>
            <FormField
              ref={register({ required: t('required') })}
              id="removewallet-secret-password"
              type="password"
              name="password"
              placeholder="********"
              errorCaption={errors.password?.message}
              containerClassName="mb-1"
            />
            <span className="text-font-description text-gray-600 w-full text-center">
              This will remove the account from this list and delete all data associated with it.
            </span>
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              className="bg-primary-low text-primary"
              disabled={submitting}
              onClick={onClose}
              type="button"
            >
              <T id="cancel" />
            </ActionModalButton>

            <ActionModalButton className="bg-error text-white" disabled={submitting} type="submit">
              <T id="remove" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      )}
    </ActionModal>
  );
});
