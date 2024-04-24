import React, { memo, useCallback, useState } from 'react';

import { Alert, FormField } from 'app/atoms';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { DisplayedGroup } from 'lib/temple/types';

import { ActionModal } from './action-modal';
import { ActionModalBodyContainer } from './action-modal-body-container';
import { ActionModalButton } from './action-modal-button';
import { ActionModalButtonsContainer } from './action-modal-buttons-container';
import { useTempleBackendActionForm } from './use-temple-backend-action-form';

interface RevealSeedPhraseModalProps {
  onClose: () => void;
  selectedGroup: DisplayedGroup;
}

export const RevealSeedPhraseModal = memo<RevealSeedPhraseModalProps>(({ onClose, selectedGroup }) => {
  const [seedPhrase, setSeedPhrase] = useState('');

  return (
    <ActionModal title={seedPhrase ? t('revealSeedPhrase') : 'Confirm Access'} onClose={onClose}>
      {seedPhrase ? (
        <>
          <ActionModalBodyContainer>
            <Alert
              type="warning"
              description={
                <p className="text-xs leading-4 text-gray-900">
                  <span className="font-semibold">Never share</span> your seed phrase or enter it into any apps. It
                  grants full access to your wallet.
                </p>
              }
              className="mb-4"
            />
            <ReadOnlySecretField value={seedPhrase} label="newRevealSeedPhraseLabel" description={null} />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton className="bg-orange-200 text-orange-20" onClick={onClose} type="button">
              <T id="cancel" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </>
      ) : (
        <RevealSeedPhraseForm onReveal={setSeedPhrase} selectedGroup={selectedGroup} />
      )}
    </ActionModal>
  );
});

interface RevealSeedPhraseFormProps {
  onReveal: (seedPhrase: string) => void;
  selectedGroup: DisplayedGroup;
}

interface FormData {
  password: string;
}

const RevealSeedPhraseForm = memo<RevealSeedPhraseFormProps>(({ onReveal, selectedGroup }) => {
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <ActionModalBodyContainer>
        <FormField
          ref={register({ required: t('required') })}
          label={t('revealSeedPhrasePasswordLabel')}
          id="revealseedphrase-secret-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          containerClassName="mb-1"
        />
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer>
        <ActionModalButton className="bg-orange-20 text-white" disabled={submitting} type="submit">
          <T id="revealSeedPhrase" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </form>
  );
});
