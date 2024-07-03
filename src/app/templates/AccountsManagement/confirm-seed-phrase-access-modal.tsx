import React, { memo, useCallback } from 'react';

import { FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalButton,
  ActionModalBodyContainer,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { DisplayedGroup } from 'lib/temple/types';

import { AccountsManagementSelectors } from './selectors';

interface ConfirmSeedPhraseAccessModalProps {
  selectedGroup: DisplayedGroup;
  onClose: EmptyFn;
  onReveal: (seedPhrase: string) => void;
}

interface FormData {
  password: string;
}

export const ConfirmSeedPhraseAccessModal = memo<ConfirmSeedPhraseAccessModalProps>(
  ({ selectedGroup, onClose, onReveal }) => {
    const { revealMnemonic } = useTempleClient();

    const revealSeedPhrase = useCallback(
      async ({ password }: FormData) => onReveal(await revealMnemonic(selectedGroup.id, password)),
      [onReveal, revealMnemonic, selectedGroup.id]
    );

    const { register, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
      revealSeedPhrase,
      'password'
    );
    const submitting = formState.isSubmitting;

    return (
      <ActionModal title={t('confirmAccess')} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ActionModalBodyContainer>
            <FormField
              ref={register({ required: t('required') })}
              label={
                <span className="text-grey-2">
                  <T id="revealSeedPhrasePasswordLabel" />
                </span>
              }
              id="revealseedphrase-secret-password"
              type="password"
              name="password"
              placeholder={t('password')}
              errorCaption={errors.password?.message}
              shouldShowRevealWhenEmpty
              containerClassName="mb-1"
              testID={AccountsManagementSelectors.passwordInput}
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary"
              disabled={submitting}
              type="submit"
              testID={AccountsManagementSelectors.confirmRevealSeedPhrase}
            >
              <T id="revealSeedPhrase" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      </ActionModal>
    );
  }
);