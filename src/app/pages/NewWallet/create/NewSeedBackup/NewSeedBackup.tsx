import React, { FC } from 'react';

import { useForm } from 'react-hook-form';

import { Alert, FormSubmitButton, FormCheckbox } from 'app/atoms';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { T, t } from 'lib/i18n';

import { NewSeedBackupSelectors } from './NewSeedBackup.selectors';

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
    <>
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

      <ReadOnlySecretField
        value={seedPhrase}
        label={'mnemonicInputLabel'}
        description={t('youWillNeedThisSeedPhrase')}
        testID={NewSeedBackupSelectors.seedPhraseValue}
        secretCoverTestId={NewSeedBackupSelectors.protectedMask}
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
          testID={NewSeedBackupSelectors.iMadeSeedPhraseBackupCheckBox}
        />

        <FormSubmitButton loading={submitting} className="w-full mt-8" testID={NewSeedBackupSelectors.nextButton}>
          <T id="next" />
        </FormSubmitButton>
      </form>
    </>
  );
};
