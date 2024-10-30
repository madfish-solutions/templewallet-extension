import React, { FC, useCallback } from 'react';

import { Controller, SubmitHandler, useForm } from 'react-hook-form-v7';

import { CaptionAlert, FormField } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { DEFAULT_PASSWORD_INPUT_PLACEHOLDER } from 'lib/constants';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { useVanishingState } from 'lib/ui/hooks';
import { delay } from 'lib/utils';

import { QrCodeModal } from './QrCodeModal';
import { SyncSettingsSelectors } from './SyncSettings.selectors';

interface FormData {
  password: string;
}

const defaultFormValues: FormData = {
  password: ''
};

const SyncSettings: FC = () => {
  const { generateSyncPayload } = useTempleClient();

  const [payload, setPayload] = useVanishingState();
  const { control, handleSubmit, setError, clearErrors, formState } = useForm<FormData>({
    mode: 'onSubmit',
    defaultValues: defaultFormValues
  });
  const { errors, isSubmitting, isValid, submitCount } = formState;

  const formSubmitted = submitCount > 0;

  const resetPayload = useCallback(() => void setPayload(null), [setPayload]);

  const onSubmit = useCallback<SubmitHandler<FormData>>(
    async ({ password }) => {
      if (formState.isSubmitting) return;

      clearErrors('password');
      try {
        const syncPayload = await generateSyncPayload(password);
        setPayload(syncPayload);
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error(err);
        }

        // Human delay.
        await delay();
        setError('password', { type: 'submit-error', message: err.message });
      }
    },
    [formState.isSubmitting, clearErrors, setError, generateSyncPayload, setPayload]
  );

  return (
    <>
      <div className="flex-1">
        <CaptionAlert type="info" title={t('syncSettingsTitle')} message={t('syncSettingsDescription')} />

        <form id="sync-form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="password"
            control={control}
            rules={{ required: t('required') }}
            render={({ field }) => (
              <FormField
                autoFocus
                type="password"
                id="reveal-secret-password"
                label={t('syncSettingsPassword')}
                placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
                errorCaption={errors.password?.message}
                testID={SyncSettingsSelectors.passwordInput}
                containerClassName="mt-6"
                {...field}
              />
            )}
          />
        </form>
      </div>

      <ActionsButtonsBox flexDirection="col" className="px-0" style={{ backgroundColor: '#FBFBFB' }}>
        <StyledButton
          type="submit"
          form="sync-form"
          size="L"
          color="primary"
          loading={isSubmitting}
          disabled={formSubmitted && !isValid}
          testID={SyncSettingsSelectors.syncButton}
        >
          Sync
        </StyledButton>
      </ActionsButtonsBox>

      {payload && <QrCodeModal onClose={resetPayload} payload={payload} />}
    </>
  );
};

export default SyncSettings;
