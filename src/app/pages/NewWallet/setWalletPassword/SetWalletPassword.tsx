import React, { FC, useCallback, useLayoutEffect, useMemo } from 'react';

import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { FormCheckbox, FormField, FormSubmitButton, PASSWORD_ERROR_CAPTION } from 'app/atoms';
import { FormCheckboxGroup } from 'app/atoms/FormCheckboxGroup';
import { ValidationLabel } from 'app/atoms/ValidationLabel';
import { formatMnemonic, PASSWORD_PATTERN, PasswordValidation, passwordValidationRegexes } from 'app/defaults';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import {
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  setPendingReactivateAdsAction,
  setAcceptedTermsVersionAction,
  setReferralLinksEnabledAction,
  setShowAgreementsCounterAction,
  setShouldShowTermsOfUseUpdateOverlayAction
} from 'app/store/settings/actions';
import { AnalyticsEventCategory, TestIDProps, useAnalytics } from 'lib/analytics';
import {
  MAX_SHOW_AGREEMENTS_COUNTER,
  PRIVACY_POLICY_URL,
  RECENT_TERMS_VERSION,
  REPLACE_REFERRALS_ENABLED,
  TERMS_OF_USE_URL,
  WEBSITES_ANALYTICS_ENABLED
} from 'lib/constants';
import { T, TID, t } from 'lib/i18n';
import { putToStorage } from 'lib/storage';
import { useTempleClient } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

import { useOnboardingProgress } from '../../Onboarding/hooks/useOnboardingProgress.hook';

import { setWalletPasswordSelectors } from './SetWalletPassword.selectors';

const validationsLabelsInputs: Array<{ textI18nKey: TID; key: keyof PasswordValidation }> = [
  { textI18nKey: 'minEightCharacters', key: 'minChar' },
  { textI18nKey: 'oneNumber', key: 'number' },
  { textI18nKey: 'oneLowerLetter', key: 'lowerCase' },
  { textI18nKey: 'oneCapitalLetter', key: 'upperCase' },
  { textI18nKey: 'specialCharacter', key: 'specialChar' }
];

interface FormData extends TestIDProps {
  shouldUseKeystorePassword?: boolean;
  password?: string;
  repeatPassword?: string;
  termsAccepted: boolean;
  analytics: boolean;
  earnTkeyRewards: boolean;
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

  const dispatchBooleanActionFactory = useCallback(
    (actionCreator: ActionCreatorWithPayload<boolean>) => {
      return (value: boolean) => dispatch(actionCreator(value));
    },
    [dispatch]
  );
  const setAnalyticsEnabled = useMemo(
    () => dispatchBooleanActionFactory(setIsAnalyticsEnabledAction),
    [dispatchBooleanActionFactory]
  );
  const setAdsViewEnabled = useMemo(
    () => dispatchBooleanActionFactory(togglePartnersPromotionAction),
    [dispatchBooleanActionFactory]
  );
  const setReferralLinksEnabled = useMemo(
    () => dispatchBooleanActionFactory(setReferralLinksEnabledAction),
    [dispatchBooleanActionFactory]
  );
  const setTermsAccepted = useCallback(() => dispatch(setAcceptedTermsVersionAction(RECENT_TERMS_VERSION)), [dispatch]);

  const { setOnboardingCompleted } = useOnboardingProgress();

  const isImportFromKeystoreFile = Boolean(keystorePassword);

  const isKeystorePasswordWeak = isImportFromKeystoreFile && !PASSWORD_PATTERN.test(keystorePassword!);

  const { control, watch, register, handleSubmit, errors, triggerValidation, formState } = useForm<FormData>({
    defaultValues: {
      shouldUseKeystorePassword: !isKeystorePasswordWeak,
      analytics: true,
      earnTkeyRewards: true
    },
    mode: 'onChange'
  });
  const { password: passwordError, ...restErrors } = errors;
  const { isSubmitting: submitting, submitCount } = formState;
  const wasSubmitted = submitCount > 0;
  const shouldDisableSubmit = Object.keys(restErrors).length > 0 || (passwordError && wasSubmitted);

  const shouldUseKeystorePassword = watch('shouldUseKeystorePassword');

  const passwordValue = watch('password');

  useLayoutEffect(() => {
    if (formState.dirtyFields.has('repeatPassword')) {
      triggerValidation('repeatPassword');
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const passwordValidation = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(passwordValidationRegexes).map(([key, regex]) => [key, regex.test(passwordValue ?? '')])
      ) as PasswordValidation,
    [passwordValue]
  );

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
        const analyticsEnabled = data.analytics;
        const adsViewEnabled = data.earnTkeyRewards;

        setAnalyticsEnabled(analyticsEnabled);
        setAdsViewEnabled(adsViewEnabled);
        setReferralLinksEnabled(adsViewEnabled);
        setTermsAccepted();

        await setOnboardingCompleted(true);

        const accountPkh = await registerWallet(password!, formatMnemonic(seedPhrase));
        // registerWallet function clears async storages
        await putToStorage(REPLACE_REFERRALS_ENABLED, adsViewEnabled);
        await putToStorage(WEBSITES_ANALYTICS_ENABLED, adsViewEnabled);
        trackEvent('AnalyticsEnabled', AnalyticsEventCategory.General, { accountPkh }, analyticsEnabled);
        trackEvent('AdsEnabled', AnalyticsEventCategory.General, { accountPkh }, adsViewEnabled);

        navigate('/loading');

        !ownMnemonic && dispatch(setOnRampPossibilityAction(true));
        // For those that had extension installed, but didn't create wallet
        dispatch(setPendingReactivateAdsAction(false));
        dispatch(setShowAgreementsCounterAction(MAX_SHOW_AGREEMENTS_COUNTER));
        dispatch(setShouldShowTermsOfUseUpdateOverlayAction(false));
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
      setAdsViewEnabled,
      setAnalyticsEnabled,
      setReferralLinksEnabled,
      setTermsAccepted,
      setOnboardingCompleted,
      registerWallet,
      seedPhrase,
      trackEvent,
      dispatch
    ]
  );

  return (
    <form
      className={classNames('w-full max-w-sm mx-auto my-4', ownMnemonic && 'pb-20')}
      onSubmit={handleSubmit(onSubmit)}
    >
      {ownMnemonic && isImportFromKeystoreFile && (
        <div className="w-full mb-6 mt-8">
          <Controller
            control={control}
            name="shouldUseKeystorePassword"
            as={FormCheckbox}
            label={t('useKeystorePassword')}
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
            errorCaption={wasSubmitted ? errors.password?.message : undefined}
            testID={setWalletPasswordSelectors.passwordField}
          />

          <div className="flex flex-wrap gap-x-1 gap-y-2">
            {validationsLabelsInputs.map(({ textI18nKey, key }) => (
              <ValidationLabel
                text={t(textI18nKey)}
                key={key}
                status={
                  passwordValidation[key] ? 'success' : key === 'specialChar' || !wasSubmitted ? 'default' : 'error'
                }
              />
            ))}
          </div>

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
            containerClassName="mt-6 mb-8"
            testID={setWalletPasswordSelectors.repeatPasswordField}
          />
        </>
      )}

      <FormCheckboxGroup className="mb-4">
        <Controller
          basic
          control={control}
          name="analytics"
          as={FormCheckbox}
          label={t('usageAnalytics')}
          labelDescription={
            <T
              id="analyticsInputDescription"
              substitutions={[
                <a
                  href="https://www.templewallet.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary"
                >
                  <T id="anonymousAnalytics" key="analyticsLink" />
                </a>
              ]}
            />
          }
          testID={setWalletPasswordSelectors.analyticsCheckBox}
        />

        <Controller
          basic
          control={control}
          name="earnTkeyRewards"
          as={FormCheckbox}
          label={t('earnTkeyRewards')}
          labelDescription={<T id="earnTkeyRewardsDescription" />}
          testID={setWalletPasswordSelectors.viewAdsCheckBox}
        />
      </FormCheckboxGroup>

      <FormCheckboxGroup isError={Boolean(errors.termsAccepted)} className="mb-8">
        <FormCheckbox
          basic
          ref={register({
            validate: val => val || t('confirmTermsError')
          })}
          name="termsAccepted"
          label={t('acceptTerms')}
          testID={setWalletPasswordSelectors.acceptTermsCheckbox}
          labelDescription={
            <T
              id="acceptTermsInputDescription"
              substitutions={[
                <a
                  href={TERMS_OF_USE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary"
                >
                  <T id="termsOfUsage" key="termsLink" />
                </a>,
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary"
                >
                  <T id="privacyPolicy" key="privacyPolicyLink" />
                </a>
              ]}
            />
          }
        />
      </FormCheckboxGroup>

      <FormSubmitButton
        disabled={shouldDisableSubmit}
        loading={submitting}
        className="w-full"
        testID={ownMnemonic ? setWalletPasswordSelectors.importButton : setWalletPasswordSelectors.createButton}
      >
        <T id={ownMnemonic ? 'import' : 'create'} />
      </FormSubmitButton>
    </form>
  );
};
