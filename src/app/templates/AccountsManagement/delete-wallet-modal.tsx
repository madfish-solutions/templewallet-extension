import React, { memo, useCallback } from 'react';

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

import { AccountsManagementSelectors } from './selectors';

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
  const shouldPreventDeletion = hdGroups.length === 1 && selectedGroup.type === TempleAccountType.HD;
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
  const { register, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    deleteGroup,
    'password'
  );
  const submitting = formState.isSubmitting;

  return (
    <ActionModal title={`Delete ${selectedGroup.name}?`} closable={false}>
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

            <FormField
              ref={register({ required: t('required') })}
              label={<T id="deleteWalletPasswordLabel" />}
              labelContainerClassName="text-grey-2"
              id="removewallet-secret-password"
              type="password"
              name="password"
              placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
              errorCaption={errors.password?.message}
              containerClassName="mb-1"
              testID={AccountsManagementSelectors.passwordInput}
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary-low"
              disabled={submitting}
              onClick={onClose}
              type="button"
              testID={AccountsManagementSelectors.cancelButton}
            >
              <T id="cancel" />
            </ActionModalButton>

            <ActionModalButton
              color="red"
              disabled={submitting}
              type="submit"
              testID={AccountsManagementSelectors.confirmDeleteButton}
            >
              <T id="delete" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      )}
    </ActionModal>
  );
});
