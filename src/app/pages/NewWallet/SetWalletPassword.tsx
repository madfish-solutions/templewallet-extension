import React, { FC, useCallback, useLayoutEffect, useState } from 'react';

import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import { AnalyticsEventCategory, useAnalytics, useAnalyticsSettings } from '../../../lib/analytics';
import { T, t } from '../../../lib/i18n/react';
import { useTempleClient } from '../../../lib/temple/front';
import PasswordStrengthIndicator, { PasswordValidation } from '../../../lib/ui/PasswordStrengthIndicator';
import FormCheckbox from '../../atoms/FormCheckbox';
import FormField, { PASSWORD_ERROR_CAPTION } from '../../atoms/FormField';
import FormSubmitButton from '../../atoms/FormSubmitButton';
import {
  formatMnemonic,
  lettersNumbersMixtureRegx,
  PASSWORD_PATTERN,
  specialCharacterRegx,
  uppercaseLowercaseMixtureRegx
} from '../../defaults';
import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';

export const MIN_PASSWORD_LENGTH = 8;

interface FormData {
  shouldUseKeystorePassword?: boolean;
  password?: string;
  repeatPassword?: string;
  termsAccepted: boolean;
  analytics?: boolean;
  skipOnboarding?: boolean;
}

interface SetWalletPasswordProps {
  ownMnemonic?: boolean;
  seedPhrase: string;
  keystorePassword?: string;
}

export const SetWalletPassword: FC<SetWalletPasswordProps> = ({
  ownMnemonic = false,
  seedPhrase,
  keystorePassword
}) => {
  const { registerWallet } = useTempleClient();
  const { trackEvent } = useAnalytics();

  const { setAnalyticsEnabled } = useAnalyticsSettings();
  const { setOnboardingCompleted } = useOnboardingProgress();

  const isImportFromKeystoreFile = Boolean(keystorePassword);

  const [focused, setFocused] = useState(false);

  const { control, watch, register, handleSubmit, errors, triggerValidation, formState } = useForm<FormData>({
    defaultValues: { shouldUseKeystorePassword: isImportFromKeystoreFile, analytics: true, skipOnboarding: false },
    mode: 'onChange'
  });
  const submitting = formState.isSubmitting;

  const shouldUseKeystorePassword = watch('shouldUseKeystorePassword');

  const passwordValue = watch('password');

  const isPasswordError = errors.password?.message === PASSWORD_ERROR_CAPTION;

  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minChar: false,
    cases: false,
    number: false,
    specialChar: false
  });

  useLayoutEffect(() => {
    if (formState.dirtyFields.has('repeatPassword')) {
      triggerValidation('repeatPassword');
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const tempValue = e.target.value;
    setPasswordValidation({
      minChar: tempValue.length >= MIN_PASSWORD_LENGTH,
      cases: uppercaseLowercaseMixtureRegx.test(tempValue),
      number: lettersNumbersMixtureRegx.test(tempValue),
      specialChar: specialCharacterRegx.test(tempValue)
    });
  };

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;

      const password = ownMnemonic
        ? data.shouldUseKeystorePassword
          ? keystorePassword
          : data.password
        : data.password;
      try {
        console.log('1');
        setAnalyticsEnabled(data.analytics);
        console.log('2');
        setOnboardingCompleted(data.skipOnboarding!);
        console.log('3');

        await registerWallet(password!, formatMnemonic(seedPhrase));
        console.log('4');
        trackEvent(
          data.skipOnboarding ? 'OnboardingSkipped' : 'OnboardingNotSkipped',
          AnalyticsEventCategory.General,
          undefined,
          data.analytics
        );
        console.log('5');
      } catch (err: any) {
        console.error(err);

        alert(err.message);
      }
    },
    [
      trackEvent,
      setAnalyticsEnabled,
      setOnboardingCompleted,
      ownMnemonic,
      seedPhrase,
      keystorePassword,
      submitting,
      registerWallet
    ]
  );

  return (
    <form
      className={classNames('w-full max-w-sm mx-auto my-8', ownMnemonic && 'pb-20')}
      onSubmit={handleSubmit(onSubmit)}
    >
      {ownMnemonic && isImportFromKeystoreFile && (
        <Controller
          control={control}
          name="shouldUseKeystorePassword"
          as={FormCheckbox}
          label={t('useKeystorePassword')}
          containerClassName={classNames('mb-6', 'mt-8')}
          onClick={() =>
            setPasswordValidation({
              minChar: false,
              cases: false,
              number: false,
              specialChar: false
            })
          }
        />
      )}

      {!shouldUseKeystorePassword && (
        <>
          <FormField
            ref={register({
              required: PASSWORD_ERROR_CAPTION,
              pattern: {
                value: PASSWORD_PATTERN,
                message: PASSWORD_ERROR_CAPTION
              }
            })}
            label={t('password')}
            labelDescription={t('unlockPasswordInputDescription')}
            id="newwallet-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            onFocus={() => setFocused(true)}
            onChange={handlePasswordChange}
          />

          {passwordValidation && (
            <>
              {isPasswordError && (
                <PasswordStrengthIndicator validation={passwordValidation} isPasswordError={isPasswordError} />
              )}
              {!isPasswordError && focused && (
                <PasswordStrengthIndicator validation={passwordValidation} isPasswordError={isPasswordError} />
              )}
            </>
          )}

          <FormField
            ref={register({
              required: t('required'),
              validate: val => val === passwordValue || t('mustBeEqualToPasswordAbove')
            })}
            label={t('repeatPassword')}
            labelDescription={t('repeatPasswordInputDescription')}
            id="newwallet-repassword"
            type="password"
            name="repeatPassword"
            placeholder="********"
            errorCaption={errors.repeatPassword?.message}
            containerClassName="my-6"
          />
        </>
      )}

      <Controller
        control={control}
        name="analytics"
        as={FormCheckbox}
        label={t('analytics')}
        labelDescription={
          <T
            id="analyticsInputDescription"
            substitutions={[
              <T id="analyticsCollecting" key="analyticsLink">
                {message => (
                  <a
                    href="https://templewallet.com/analytics-collecting"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-secondary"
                  >
                    {message}
                  </a>
                )}
              </T>
            ]}
          />
        }
        containerClassName="mb-4"
      />

      <Controller
        control={control}
        name="skipOnboarding"
        as={FormCheckbox}
        label={t('skipOnboarding')}
        labelDescription={t('advancedUser')}
        containerClassName="mb-4"
      />

      <FormCheckbox
        ref={register({
          validate: val => val || t('confirmTermsError')
        })}
        errorCaption={errors.termsAccepted?.message}
        name="termsAccepted"
        label={t('acceptTerms')}
        labelDescription={
          <T
            id="acceptTermsInputDescription"
            substitutions={[
              <T id="termsOfUsage" key="termsLink">
                {message => (
                  <a
                    href="https://templewallet.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-secondary"
                  >
                    {message}
                  </a>
                )}
              </T>,
              <T id="privacyPolicy" key="privacyPolicyLink">
                {message => (
                  <a
                    href="https://templewallet.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-secondary"
                  >
                    {message}
                  </a>
                )}
              </T>
            ]}
          />
        }
        containerClassName="mb-8"
      />

      <FormSubmitButton loading={submitting} style={{ display: 'block', width: '100%', fontSize: 14, fontWeight: 500 }}>
        <T id={ownMnemonic ? 'import' : 'create'} />
      </FormSubmitButton>
    </form>
  );
};
