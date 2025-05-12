import React, { memo, useCallback } from 'react';

import { useForm } from 'react-hook-form-v7';

import { FormField } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { TextButton } from 'app/atoms/TextButton';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { toastError } from 'app/toaster';
import { deleteGoogleDriveFile } from 'lib/apis/google';
import { DEFAULT_PASSWORD_INPUT_PLACEHOLDER } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { BackupDamagedError, EncryptedBackupObject, backupFileName, getSeedPhrase } from 'lib/temple/backup';
import { useTempleClient } from 'lib/temple/front';
import { useBooleanState } from 'lib/ui/hooks';
import { useShakeOnErrorTrigger } from 'lib/ui/hooks/use-shake-on-error-trigger';
import { serializeError } from 'lib/utils/serialize-error';

import { GoogleBackupFormSelectors } from '../selectors';

import DecryptIllustrationSrc from './decrypt-illustration.png';
import { DeleteBackupModal } from './delete-backup-modal';
import { ForgotPasswordModal } from './forgot-password-modal';

interface DecryptBackupProps {
  next: (seed?: string, password?: string) => void;
  backupContent: EncryptedBackupObject;
}

interface FormData {
  password: string;
}

export const DecryptBackup = memo<DecryptBackupProps>(({ next, backupContent }) => {
  const { googleAuthToken } = useTempleClient();
  const [forgotPasswordModalOpened, openForgotPasswordModal, closeForgotPasswordModal] = useBooleanState(false);
  const [deleteBackupModalOpened, openDeleteBackupModal, closeDeleteBackupModal] = useBooleanState(false);
  const { register, handleSubmit, setError, formState } = useForm<FormData>();
  const { errors, submitCount, isSubmitting } = formState;

  const proceedToDeleteModal = useCallback(() => {
    closeForgotPasswordModal();
    openDeleteBackupModal();
  }, [closeForgotPasswordModal, openDeleteBackupModal]);

  const deleteBackup = useCallback(async () => {
    closeDeleteBackupModal();
    try {
      await deleteGoogleDriveFile(backupFileName, googleAuthToken!);
      next();
    } catch (error) {
      console.error(error);
      toastError(t('deleteBackupError', serializeError(error) ?? t('unknownError')));
    }
  }, [closeDeleteBackupModal, googleAuthToken, next]);

  const onSubmit = useCallback(
    async ({ password }: FormData) => {
      try {
        const seed = await getSeedPhrase(backupContent, password);
        next(seed, password);
      } catch (error) {
        console.error(error);
        setError('password', {
          message: error instanceof BackupDamagedError ? error.message : t('incorrectPasswordError')
        });
      }
    },
    [backupContent, next, setError]
  );

  const passwordShakeTrigger = useShakeOnErrorTrigger(submitCount, errors.password);

  return (
    <>
      <PageModalScrollViewWithActions
        initialBottomEdgeVisible
        actionsBoxProps={{
          children: (
            <StyledButton
              size="L"
              color="primary"
              type="submit"
              loading={isSubmitting}
              testID={GoogleBackupFormSelectors.continueButton}
              form="decrypt-backup"
            >
              <T id="continue" />
            </StyledButton>
          )
        }}
      >
        <div className="-mx-4">
          <img src={DecryptIllustrationSrc} alt="" className="w-full h-auto" />
        </div>

        <form
          className="flex-grow flex flex-col items-center mb-4"
          id="decrypt-backup"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex-1 flex flex-col items-center">
            <p className="mb-2 text-center text-font-regular-bold">
              <T id="decryptYourBackup" />
            </p>

            <p className="mx-1 mb-6 text-center text-font-description text-grey-1">
              <T id="decryptYourBackupDescription" />
            </p>

            <FormField
              {...register('password', { required: t('required') })}
              id="decryption-password"
              type="password"
              placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
              errorCaption={errors.password?.message}
              shakeTrigger={passwordShakeTrigger}
              containerClassName="mb-3"
              autoFocus
              testID={GoogleBackupFormSelectors.decryptionPasswordInput}
            />
          </div>

          <TextButton color="grey" onClick={openForgotPasswordModal}>
            <T id="forgotPasswordQuestion" />
          </TextButton>
        </form>
      </PageModalScrollViewWithActions>

      {forgotPasswordModalOpened && (
        <ForgotPasswordModal onClose={closeForgotPasswordModal} onContinueClick={proceedToDeleteModal} />
      )}
      {deleteBackupModalOpened && <DeleteBackupModal onCancel={closeDeleteBackupModal} onDelete={deleteBackup} />}
    </>
  );
});
