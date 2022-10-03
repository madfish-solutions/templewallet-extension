import React, { FC } from 'react';

import { useForm } from 'react-hook-form';

import { Alert, FormField, FormSubmitButton, FormCheckbox } from 'app/atoms';
import { T, t } from 'lib/i18n/react';

interface BackupFormData {
  backuped: boolean;
}

interface NewSeedBackupProps {
  seedPhrase: string;
  onBackupComplete: () => void;
}

export const NewSeedBackup: FC<NewSeedBackupProps> = ({ seedPhrase, onBackupComplete }) => {
  const { register, handleSubmit, errors, formState } = useForm<BackupFormData>();
  const submitting = formState.isSubmitting;

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <Alert
        title={''}
        description={
          <>
            <p>
              <T id="revealNewSeedPhrase" />
            </p>

            <p className="mt-1">
              <T id="doNotSharePhrase" />
            </p>
          </>
        }
        className="mt-4 mb-8"
      />

      <FormField
        secret
        textarea
        rows={4}
        readOnly
        label={t('mnemonicInputLabel')}
        labelDescription={t('youWillNeedThisSeedPhrase')}
        id="backup-mnemonic"
        spellCheck={false}
        containerClassName="mb-4"
        className="resize-none notranslate"
        value={seedPhrase}
      />

      <form className="w-full mt-8" onSubmit={handleSubmit(onBackupComplete)}>
        <FormCheckbox
          ref={register({
            validate: val => val || t('unableToContinueWithoutConfirming')
          })}
          errorCaption={errors.backuped?.message}
          name="backuped"
          label={t('backupedInputLabel')}
          labelDescription={<T id="backupedInputDescription" />}
          containerClassName="mb-6"
        />

        <FormSubmitButton
          loading={submitting}
          style={{ display: 'block', width: '100%', marginTop: 32, fontSize: 14, fontWeight: 500 }}
        >
          <T id="next" />
        </FormSubmitButton>
      </form>
    </div>
  );
};
