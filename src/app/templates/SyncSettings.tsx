import React, { FC, useCallback, useLayoutEffect, useRef } from 'react';

import classNames from 'clsx';
import { OnSubmit, useForm } from 'react-hook-form';
import { QRCode } from 'react-qr-svg';

import { Alert, FormField, FormSubmitButton } from 'app/atoms';
import { T, t } from 'lib/i18n/react';
import { useSecretState, useTempleClient } from 'lib/temple/front';

type FormData = {
  password: string;
};

const SyncSettings: FC = () => {
  const { generateSyncPayload } = useTempleClient();

  const formRef = useRef<HTMLFormElement>(null);
  const [payload, setPayload] = useSecretState();
  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();

  const focusPasswordField = useCallback(
    () => formRef.current?.querySelector<HTMLInputElement>("input[name='password']")?.focus(),
    []
  );

  useLayoutEffect(() => focusPasswordField(), [focusPasswordField]);

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ password }) => {
      if (formState.isSubmitting) return;

      clearError('password');
      try {
        const syncPayload = await generateSyncPayload(password);
        setPayload(syncPayload);
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error(err);
        }

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('password', 'submit-error', err.message);
        focusPasswordField();
      }
    },
    [formState.isSubmitting, clearError, setError, generateSyncPayload, setPayload, focusPasswordField]
  );

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      {payload ? (
        <>
          <Alert
            title={t('attentionExclamation')}
            description={
              <p>
                <T id="syncSettingsAlert" />
              </p>
            }
            className="mt-4 mb-8"
          />

          <p className="mb-4 text-sm text-gray-600">
            <T id="scanQRWithTempleMobile" />
          </p>

          <div className={classNames('mb-8 p-1', 'bg-gray-100 border-2 border-gray-300', 'rounded')}>
            <QRCode value={payload} bgColor="#f7fafc" fgColor="#000000" level="Q" style={{ width: '100%' }} />
          </div>

          <FormSubmitButton className="w-full justify-center" onClick={() => setPayload(null)}>
            <T id="done" />
          </FormSubmitButton>
        </>
      ) : (
        <>
          <h2 className="mb-3 text-base text-gray-700">
            <T id="syncSettingsTitle" />
          </h2>

          <p className="mb-6 text-xs text-gray-600">
            <T id="syncSettingsDescription" />
          </p>

          <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
            <FormField
              ref={register({ required: t('required') })}
              label={t('password')}
              labelDescription={t('syncPasswordDescription')}
              id="reveal-secret-password"
              type="password"
              name="password"
              placeholder="********"
              errorCaption={errors.password?.message}
              containerClassName="mb-4"
            />

            <FormSubmitButton loading={formState.isSubmitting}>
              <T id="sync" />
            </FormSubmitButton>
          </form>
        </>
      )}
    </div>
  );
};

export default SyncSettings;
