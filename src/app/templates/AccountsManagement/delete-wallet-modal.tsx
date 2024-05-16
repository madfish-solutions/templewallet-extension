import React, { memo, useCallback } from 'react';

import { Alert, FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalButton,
  ActionModalBodyContainer,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { DisplayedGroup, TempleAccountType } from 'lib/temple/types';
import { useHDGroups } from 'temple/front';

interface DeleteWalletModalProps {
  onClose: () => void;
  selectedGroup: DisplayedGroup;
}

const removeWarningsI18nKeys = {
  [TempleAccountType.HD]: 'hdWalletRemoveWarning' as const,
  [TempleAccountType.Imported]: 'importedAccountsRemoveWarning' as const
};

interface FormData {
  password: string;
}

export const DeleteWalletModal = memo<DeleteWalletModalProps>(({ onClose, selectedGroup }) => {
  const { removeAccountsByType, removeHdGroup } = useTempleClient();
  const hdGroups = useHDGroups();
  const shouldPreventDeletion = hdGroups.length === 1 && selectedGroup.type === TempleAccountType.HD;
  const removeWarningsI18nKey =
    selectedGroup.type in removeWarningsI18nKeys
      ? removeWarningsI18nKeys[selectedGroup.type as keyof typeof removeWarningsI18nKeys]
      : undefined;

  const deleteGroup = useCallback(
    async ({ password }: FormData) => {
      selectedGroup.type === TempleAccountType.HD
        ? await removeHdGroup(selectedGroup.id, password)
        : await removeAccountsByType(selectedGroup.type, password);
      onClose();
    },
    [onClose, removeAccountsByType, removeHdGroup, selectedGroup]
  );
  const { register, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    deleteGroup,
    'password'
  );
  const submitting = formState.isSubmitting;

  return (
    <ActionModal title={`Delete ${selectedGroup.name}?`} onClose={onClose}>
      {shouldPreventDeletion ? (
        <>
          <ActionModalBodyContainer>
            <Alert
              type="error"
              title={<T id="cannotBeRemoved" />}
              description={
                <p>
                  <T id="walletsToRemoveConstraint" />
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
            {removeWarningsI18nKey && (
              <Alert
                type="warning"
                description={
                  <p className="text-xs leading-4 text-gray-900">
                    <T id={removeWarningsI18nKey} />
                  </p>
                }
                className="mb-1"
              />
            )}

            <FormField
              ref={register({ required: t('required') })}
              label={t('deleteWalletPasswordLabel')}
              id="removewallet-secret-password"
              type="password"
              name="password"
              placeholder="********"
              errorCaption={errors.password?.message}
              containerClassName="mb-1"
            />
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
              <T id="delete" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      )}
    </ActionModal>
  );
});
