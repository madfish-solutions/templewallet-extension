import React, { FC, useCallback, useLayoutEffect, useState } from 'react';

import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { FormCheckbox, FormField, FormSubmitButton, PASSWORD_ERROR_CAPTION } from 'app/atoms';
import {
  formatMnemonic,
  lettersNumbersMixtureRegx,
  PASSWORD_PATTERN,
  specialCharacterRegx,
  uppercaseLowercaseMixtureRegx
} from 'app/defaults';
import { setIsAnalyticsEnabledAction, setOnRampPossibilityAction } from 'app/store/settings/actions';
import { AnalyticsEventCategory, TestIDProps, useAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import PasswordStrengthIndicator, { PasswordValidation } from 'lib/ui/PasswordStrengthIndicator';
import { navigate } from 'lib/woozie';

import { useOnboardingProgress } from '../../Onboarding/hooks/useOnboardingProgress.hook';
import { setWalletPasswordSelectors } from './SetWalletPassword.selectors';

const MIN_PASSWORD_LENGTH = 8;

interface FormData extends TestIDProps {
  shouldUseKeystorePassword?: boolean;
  password?: string;
  repeatPassword?: string;
  termsAccepted: boolean;
  analytics?: boolean;
  skipOnboarding?: boolean;
  testID?: string;
}

interface SetWalletPasswordProps {
  ownMnemonic?: boolean;
  seedPhrase: string;
  keystorePassword?: string;
  testID?: string;
}

export const SetWalletPassword: FC<SetWalletPasswordProps> = ({
  ownMnemonic = false,
  seedPhrase,
  keystorePassword
}) => {
  const { registerWallet } = useTempleClient();
  const { trackEvent } = useAnalytics();

  const dispatch = useDispatch();

  const setAnalyticsEnabled = (analyticsEnabled: boolean) => dispatch(setIsAnalyticsEnabledAction(analyticsEnabled));
  const { setOnboardingCompleted } = useOnboardingProgress();

  const isImportFromKeystoreFile = Boolean(keystorePassword);

  const isKeystorePasswordWeak = isImportFromKeystoreFile && !PASSWORD_PATTERN.test(keystorePassword!);

  const [focused, setFocused] = useState(false);

  const { control, watch, register, handleSubmit, errors, triggerValidation, formState } = useForm<FormData>({
    defaultValues: { shouldUseKeystorePassword: !isKeystorePasswordWeak, analytics: true, skipOnboarding: false },
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
      if (shouldUseKeystorePassword && isKeystorePasswordWeak) return;

      const password = ownMnemonic
        ? data.shouldUseKeystorePassword
          ? keystorePassword
          : data.password
        : data.password;
      try {
        setAnalyticsEnabled(!!data.analytics);
        setOnboardingCompleted(data.skipOnboarding!);

        await registerWallet(password!, formatMnemonic(seedPhrase));
        trackEvent(
          data.skipOnboarding ? 'OnboardingSkipped' : 'OnboardingNotSkipped',
          AnalyticsEventCategory.General,
          undefined,
          data.analytics
        );
        navigate('/loading');
        !ownMnemonic && dispatch(setOnRampPossibilityAction(true));
      } catch (err: any) {
        console.error(err);

        alert(err.message);
      }
    },
    [
      submitting,
      shouldUseKeystorePassword,
      isKeystorePasswordWeak,
      ownMnemonic,
      keystorePassword,
      setAnalyticsEnabled,
      setOnboardingCompleted,
      registerWallet,
      seedPhrase,
      trackEvent
    ]
  );

  return (
    <form
      className={classNames('w-full max-w-sm mx-auto my-8', ownMnemonic && 'pb-20')}
      onSubmit={handleSubmit(onSubmit)}
    >
      {ownMnemonic && isImportFromKeystoreFile && (
        <div className="w-full mb-6 mt-8">
          <Controller
            control={control}
            name="shouldUseKeystorePassword"
            as={FormCheckbox}
            label={t('useKeystorePassword')}
            onClick={() =>
              setPasswordValidation({
                minChar: false,
                cases: false,
                number: false,
                specialChar: false
              })
            }
            testID={setWalletPasswordSelectors.useFilePasswordCheckBox}
          />
          {shouldUseKeystorePassword && isKeystorePasswordWeak && (
            <div className="text-xs text-red-500">
              <T id="weakKeystorePassword" />
            </div>
          )}
        </div>
      )}

      {(!shouldUseKeystorePassword || !isImportFromKeystoreFile) && (
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
            testID={setWalletPasswordSelectors.passwordField}
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
            testID={setWalletPasswordSelectors.repeatPasswordField}
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
              <a
                href="https://templewallet.com/analytics-collecting"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-secondary"
              >
                <T id="analyticsCollecting" key="analyticsLink" />
              </a>
            ]}
          />
        }
        containerClassName="mb-4"
      />

      <Controller
        control={control}
        name="skipOnboarding"
        as={p => <FormCheckbox {...p} testID={setWalletPasswordSelectors.skipOnboardingCheckbox} />}
        label={t('skipOnboarding')}
        labelDescription={t('advancedUser')}
        containerClassName="mb-4"
        testID={setWalletPasswordSelectors.skipOnboardingCheckbox}
      />

      <FormCheckbox
        ref={register({
          validate: val => val || t('confirmTermsError')
        })}
        errorCaption={errors.termsAccepted?.message}
        name="termsAccepted"
        label={t('acceptTerms')}
        testID={setWalletPasswordSelectors.acceptTermsCheckbox}
        labelDescription={
          <T
            id="acceptTermsInputDescription"
            substitutions={[
              <a
                href="https://templewallet.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-secondary"
              >
                <T id="termsOfUsage" key="termsLink" />
              </a>,
              <a
                href="https://templewallet.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-secondary"
              >
                <T id="privacyPolicy" key="privacyPolicyLink" />
              </a>
            ]}
          />
        }
        containerClassName="mb-8"
      />

      <FormSubmitButton
        loading={submitting}
        style={{ display: 'block', width: '100%', fontSize: 14, fontWeight: 500 }}
        testID={ownMnemonic ? setWalletPasswordSelectors.importButton : setWalletPasswordSelectors.createButton}
      >
        <T id={ownMnemonic ? 'import' : 'create'} />
      </FormSubmitButton>
    </form>
  );
};
