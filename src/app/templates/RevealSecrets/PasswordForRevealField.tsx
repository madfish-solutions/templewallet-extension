import React, { memo, useRef, useCallback, useLayoutEffect } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import { FormField, FormSubmitButton } from 'app/atoms';
import { TID, T, t } from 'lib/i18n';

import { RevealSecretsSelectors } from './RevealSecrets.selectors';

interface Props {
  labelDescriptionForName: TID;
  onSubmit: (password: string) => Promise<void>;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

interface FormData {
  password: string;
}

export const PasswordForRevealField = memo<Props>(({ labelDescriptionForName, onSubmit }) => {
  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const formRef = useRef<HTMLFormElement>(null);

  const focusPasswordField = useCallback(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name='password']")?.focus();
  }, []);

  useLayoutEffect(() => {
    focusPasswordField();
  }, [focusPasswordField]);

  const onSubmitLocal = useCallback<OnSubmit<FormData>>(
    ({ password }) => {
      if (submitting) return;

      clearError('password');

      onSubmit(password).catch(err => {
        console.error(err);

        setError('password', SUBMIT_ERROR_TYPE, err.message);
        focusPasswordField();
      });
    },
    [onSubmit, submitting, clearError, setError, focusPasswordField]
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmitLocal)}>
      <FormField
        ref={register({ required: t('required') })}
        label={t('password')}
        labelDescription={t('revealSecretPasswordInputDescription', t(labelDescriptionForName))}
        id="reveal-secret-password"
        type="password"
        name="password"
        placeholder="********"
        errorCaption={errors.password?.message}
        containerClassName="mb-4"
        onChange={() => clearError()}
        testID={RevealSecretsSelectors.RevealPasswordInput}
      />

      <FormSubmitButton loading={submitting} testID={RevealSecretsSelectors.RevealButton}>
        <T id="reveal" />
      </FormSubmitButton>
    </form>
  );
});
