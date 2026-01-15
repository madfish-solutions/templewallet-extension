import React, { memo, useCallback } from 'react';

import { Controller } from 'react-hook-form';

import { Alert, FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalButton,
  ActionModalBodyContainer,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { DEFAULT_PASSWORD_INPUT_PLACEHOLDER } from 'lib/constants';
import { T, TID, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { DisplayedGroup, TempleAccountType } from 'lib/temple/types';
import { useHDGroups } from 'temple/front';

import { AccountManagementSelectors } from './selectors';

interface DeleteWalletModalProps {
  onClose: EmptyFn;
  selectedGroup: DisplayedGroup;
}

const removeWarningsI18nKeys: Partial<Record<TempleAccountType, TID>> = {
  [TempleAccountType.HD]: 'hdWalletRemoveWarning',
  [TempleAccountType.Imported]: 'importedAccountsRemoveWarning'
};

interface FormData {
  password: string;
}

export const DeleteWalletModal = memo<DeleteWalletModalProps>(({ onClose, selectedGroup }) => {
  const { removeAccountsByType, removeHdGroup } = useTempleClient();
  const hdGroups = useHDGroups();
  const shouldPreventDeletion = (() => {
    if (selectedGroup.type !== TempleAccountType.HD) return false;
    return hdGroups.length > 0 && hdGroups[0].id === selectedGroup.id;
  })();
  const removeWarningsI18nKey = removeWarningsI18nKeys[selectedGroup.type];

  const deleteGroup = useCallback(
    async ({ password }: FormData) => {
      selectedGroup.type === TempleAccountType.HD
        ? await removeHdGroup(selectedGroup.id, password)
        : await removeAccountsByType(selectedGroup.type, password);
      onClose();
    },
    [onClose, removeAccountsByType, removeHdGroup, selectedGroup]
  );
  const { control, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    deleteGroup,
    'password'
  );
  const submitting = formState.isSubmitting;

  return (
    <ActionModal title={`Delete ${selectedGroup.name}?`} hasCloseButton={false} onClose={onClose}>
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
            <ActionModalButton color="primary-low" onClick={onClose} type="button">
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
                  <p className="text-font-description">
                    <T id={removeWarningsI18nKey} />
                  </p>
                }
                className="mb-1"
              />
            )}

            <Controller
              name="password"
              control={control}
              rules={{ required: t('required') }}
              render={({ field }) => (
                <FormField
                  {...field}
                  label={<T id="deleteWalletPasswordLabel" />}
                  labelContainerClassName="text-grey-2"
                  id="removewallet-secret-password"
                  type="password"
                  placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
                  errorCaption={errors.password?.message}
                  reserveSpaceForError={false}
                  containerClassName="mb-1"
                  testID={AccountManagementSelectors.passwordInput}
                />
              )}
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary-low"
              disabled={submitting}
              onClick={onClose}
              type="button"
              testID={AccountManagementSelectors.cancelButton}
            >
              <T id="cancel" />
            </ActionModalButton>

            <ActionModalButton
              color="red"
              disabled={submitting}
              type="submit"
              testID={AccountManagementSelectors.confirmDeleteButton}
            >
              <T id="delete" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      )}
    </ActionModal>
  );
});
