import React, { memo, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';

import { generateMnemonic } from 'bip39';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { FormField, PASSWORD_ERROR_CAPTION } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { StyledButton } from 'app/atoms/StyledButton';
import { ValidationLabel } from 'app/atoms/ValidationLabel';
import { PASSWORD_PATTERN, PasswordValidation, formatMnemonic, passwordValidationRegexes } from 'app/defaults';
import { useOnboardingProgress } from 'app/pages/Onboarding/hooks/useOnboardingProgress.hook';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import {
  setAcceptedTermsVersionAction,
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  setPendingReactivateAdsAction,
  setReferralLinksEnabledAction,
  setShouldShowTermsOfUseUpdateOverlayAction,
  setShowAgreementsCounterAction
} from 'app/store/settings/actions';
import { toastError } from 'app/toaster';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import {
  DEFAULT_PASSWORD_INPUT_PLACEHOLDER,
  MAX_SHOW_AGREEMENTS_COUNTER,
  PRIVACY_POLICY_URL,
  RECENT_TERMS_VERSION,
  REPLACE_REFERRALS_ENABLED,
  SHOULD_BACKUP_MNEMONIC_STORAGE_KEY,
  TERMS_OF_USE_URL,
  WEBSITES_ANALYTICS_ENABLED
} from 'lib/constants';
import { T, TID, t } from 'lib/i18n';
import { putToStorage } from 'lib/storage';
import { useStorage, useTempleClient } from 'lib/temple/front';
import { setMnemonicToBackup } from 'lib/temple/front/mnemonic-to-backup-keeper';
import { SuccessfulInitToastContext } from 'lib/temple/front/successful-init-toast-context';
import { navigate } from 'lib/woozie';

import { createPasswordSelectors } from './selectors';

interface FormData {
  password?: string;
  repeatPassword?: string;
  analytics: boolean;
  getRewards: boolean;
}

interface CreatePasswordFormProps {
  seedPhrase?: string;
}

const validationsLabelsInputs: Array<{ textI18nKey: TID; key: keyof PasswordValidation }> = [
  { textI18nKey: 'eightCharacters', key: 'minChar' },
  { textI18nKey: 'atLeastOneNumber', key: 'number' },
  { textI18nKey: 'specialCharacter', key: 'specialChar' },
  { textI18nKey: 'atLeastOneCapital', key: 'upperCase' },
  { textI18nKey: 'atLeastOneLowercase', key: 'lowerCase' }
];

export const CreatePasswordForm = memo<CreatePasswordFormProps>(({ seedPhrase: seedPhraseToImport }) => {
  const { registerWallet } = useTempleClient();
  const { trackEvent } = useAnalytics();
  const [, setShouldBackupMnemonic] = useStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY);
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
  const { setOnboardingCompleted } = useOnboardingProgress();
  const [, setInitToast] = useContext(SuccessfulInitToastContext);

  const dispatch = useDispatch();

  const setTermsAccepted = useCallback(() => dispatch(setAcceptedTermsVersionAction(RECENT_TERMS_VERSION)), [dispatch]);

  const { control, watch, register, handleSubmit, errors, triggerValidation, formState, setValue } = useForm<FormData>({
    defaultValues: {
      analytics: true,
      getRewards: true
    },
    mode: 'onChange'
  });
  const submitting = formState.isSubmitting;
  const wasSubmitted = formState.submitCount > 0;

  const passwordValue = watch('password');
  const repeatPasswordValue = watch('repeatPassword');

  const passwordValidation = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(passwordValidationRegexes).map(([key, regex]) => [key, regex.test(passwordValue ?? '')])
      ) as PasswordValidation,
    [passwordValue]
  );

  const seedPhrase = useMemo(() => seedPhraseToImport ?? generateMnemonic(128), [seedPhraseToImport]);

  useLayoutEffect(() => {
    if (formState.dirtyFields.has('repeatPassword')) {
      triggerValidation('repeatPassword');
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      // TODO: enable onboarding when it is reimplemented
      await setOnboardingCompleted(true);

      if (submitting) return;

      try {
        dispatch(togglePartnersPromotionAction(data.getRewards));
        dispatch(setIsAnalyticsEnabledAction(data.analytics));
        const shouldEnableWebsiteAnalytics = data.getRewards && data.analytics;
        await putToStorage(WEBSITES_ANALYTICS_ENABLED, shouldEnableWebsiteAnalytics);
        dispatch(setReferralLinksEnabledAction(true));
        setTermsAccepted();

        const accountPkh = await registerWallet(data.password!, formatMnemonic(seedPhrase));

        // registerWallet function clears async storages
        await putToStorage(REPLACE_REFERRALS_ENABLED, true);
        await putToStorage(WEBSITES_ANALYTICS_ENABLED, data.getRewards);

        if (shouldEnableWebsiteAnalytics) {
          trackEvent('AnalyticsAndAdsEnabled', AnalyticsEventCategory.General, { accountPkh }, data.analytics);
        }
        if (seedPhraseToImport) {
          setInitToast(t('importSuccessful'));
        } else {
          await setShouldBackupMnemonic(true);
          setMnemonicToBackup(seedPhrase);
        }
        dispatch(setOnRampPossibilityAction(!seedPhraseToImport));
        navigate('/loading');

        // For those that had extension installed, but didn't create wallet
        dispatch(setPendingReactivateAdsAction(false));
        dispatch(setShowAgreementsCounterAction(MAX_SHOW_AGREEMENTS_COUNTER));
        dispatch(setShouldShowTermsOfUseUpdateOverlayAction(false));
      } catch (err: any) {
        console.error(err);

        toastError(err.message);
      }
    },
    [
      setOnboardingCompleted,
      submitting,
      dispatch,
      setTermsAccepted,
      registerWallet,
      seedPhrase,
      seedPhraseToImport,
      trackEvent,
      setInitToast,
      setShouldBackupMnemonic
    ]
  );

  const cleanPassword = useCallback(async () => setValue('password', '', true), [setValue]);
  const cleanRepeatPassword = useCallback(async () => setValue('repeatPassword', '', true), [setValue]);

  const submitButtonNameI18nKey = seedPhraseToImport ? 'importWallet' : 'createWallet';
  const submitButtonTestID = seedPhraseToImport
    ? createPasswordSelectors.importButton
    : createPasswordSelectors.createButton;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col max-h-full">
      <ScrollView className="pt-4 pb-6" bottomEdgeThreshold={24} onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <div className="flex-1 flex flex-col">
          <FormField
            ref={register({
              required: PASSWORD_ERROR_CAPTION,
              pattern: {
                value: PASSWORD_PATTERN,
                message: PASSWORD_ERROR_CAPTION
              }
            })}
            label={<T id="enterYourPassword" />}
            id="newwallet-password"
            type="password"
            name="password"
            placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
            errorCaption={errors.password?.message}
            shouldShowErrorCaption={false}
            fieldWrapperBottomMargin={false}
            cleanable={passwordValue ? passwordValue.length > 0 : false}
            containerClassName="mb-2"
            shouldShowRevealWhenEmpty
            testID={createPasswordSelectors.passwordField}
            onClean={cleanPassword}
          />
          <div className="flex flex-wrap gap-1">
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
            label={<T id="repeatPassword" />}
            id="newwallet-repassword"
            type="password"
            name="repeatPassword"
            placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
            errorCaption={errors.repeatPassword?.message}
            cleanable={repeatPasswordValue ? repeatPasswordValue.length > 0 : false}
            containerClassName="my-4"
            shouldShowRevealWhenEmpty
            testID={createPasswordSelectors.repeatPasswordField}
            onClean={cleanRepeatPassword}
          />
        </div>
        <div className="w-full flex flex-col gap-3">
          <Controller
            control={control}
            name="analytics"
            as={SettingsCheckbox}
            label={<T id="usageAnalytics" />}
            tooltip={<T id="analyticsInputDescription" />}
            testID={createPasswordSelectors.analyticsCheckBox}
          />

          <Controller
            control={control}
            name="getRewards"
            as={SettingsCheckbox}
            label={<T id="earnRewardsWithAds" />}
            tooltip={<T id="earnRewardsWithAdsDescription" />}
            testID={createPasswordSelectors.getRewardsCheckBox}
          />
        </div>
        <span className="w-full text-center text-font-small text-grey-1 mt-6">
          <T
            id="twTermsAndPrivacyLinks"
            substitutions={[
              <span key="buttonContent">
                <T id={submitButtonNameI18nKey} />
              </span>,
              <a
                href={TERMS_OF_USE_URL}
                key="termsLink"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                <T id="termsOfUsage" />
              </a>,
              <a
                href={PRIVACY_POLICY_URL}
                key="privacyPolicyLink"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                <T id="privacyPolicy" />
              </a>
            ]}
          />
        </span>
      </ScrollView>
      <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
        <StyledButton size="L" color="primary" type="submit" disabled={submitting} testID={submitButtonTestID}>
          <T id={submitButtonNameI18nKey} />
        </StyledButton>
      </ActionsButtonsBox>
    </form>
  );
});
