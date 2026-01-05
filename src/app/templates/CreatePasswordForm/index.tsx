import React, { memo, useCallback, useLayoutEffect, useMemo } from 'react';

import { generateMnemonic } from 'bip39';
import clsx from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import { Alert, FormField, PASSWORD_ERROR_CAPTION } from 'app/atoms';
import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { StyledButton } from 'app/atoms/StyledButton';
import { TextButton } from 'app/atoms/TextButton';
import { ValidationLabel } from 'app/atoms/ValidationLabel';
import { PASSWORD_PATTERN, PasswordValidation, formatMnemonic, passwordValidationRegexes } from 'app/defaults';
import { setIsSidebarByDefault } from 'app/env';
import { useFirefoxDataConsent } from 'app/pages/Welcome/data-collection-agreement/use-firefox-data-consent.hook';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { setIsAnalyticsEnabledAction, setReferralLinksEnabledAction } from 'app/store/settings/actions';
import { toastError } from 'app/toaster';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import {
  DEFAULT_PASSWORD_INPUT_PLACEHOLDER,
  KOLO_FORCE_LOGOUT_ON_NEXT_OPEN_STORAGE_KEY,
  PRIVACY_POLICY_URL,
  REPLACE_REFERRALS_ENABLED,
  SHOULD_BACKUP_MNEMONIC_STORAGE_KEY,
  SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY,
  SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY,
  SHOULD_PROMOTE_ROOTSTOCK_STORAGE_KEY,
  SIDE_VIEW_WAS_FORCED_STORAGE_KEY,
  TERMS_OF_USE_URL,
  WEBSITES_ANALYTICS_ENABLED
} from 'lib/constants';
import { DISABLE_ADS, IS_SIDE_PANEL_AVAILABLE } from 'lib/env';
import { T, TID, t } from 'lib/i18n';
import { putToStorage } from 'lib/storage';
import { writeGoogleDriveBackup } from 'lib/temple/backup';
import { useStorage, useTempleClient } from 'lib/temple/front';
import { setBackupCredentials } from 'lib/temple/front/mnemonic-to-backup-keeper';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { useBooleanState } from 'lib/ui/hooks';
import { navigate } from 'lib/woozie';

import { PageModalScrollViewWithActions } from '../page-modal-scroll-view-with-actions';

import { createPasswordSelectors } from './selectors';

interface FormData {
  password: string;
  repeatPassword: string;
  analytics: boolean;
  getRewards: boolean;
}

interface CreatePasswordFormProps {
  mnemonic?: string;
  backupPassword?: string;
  onNewBackupState?: (mnemonic: string, password: string, success: boolean) => void;
}

const validationsLabelsInputs: Array<{ textI18nKey: TID; key: keyof PasswordValidation }> = [
  { textI18nKey: 'eightCharacters', key: 'minChar' },
  { textI18nKey: 'atLeastOneNumber', key: 'number' },
  { textI18nKey: 'specialCharacter', key: 'specialChar' },
  { textI18nKey: 'atLeastOneCapital', key: 'upperCase' },
  { textI18nKey: 'atLeastOneLowercase', key: 'lowerCase' }
];

export const CreatePasswordForm = memo<CreatePasswordFormProps>(
  ({ mnemonic: mnemonicToImport, backupPassword, onNewBackupState }) => {
    const { googleAuthToken, registerWallet, setSuppressReady } = useTempleClient();
    const { trackEvent } = useAnalytics();
    const [, setInitToast] = useInitToastMessage();
    const [backupPasswordUsed, goToBackupPassword, goToCustomPassword] = useBooleanState(false);

    const [_, setSideViewWasForced] = useStorage(SIDE_VIEW_WAS_FORCED_STORAGE_KEY);

    const [consent] = useFirefoxDataConsent();

    const defaultCheckboxValues = useMemo(() => {
      if (consent && consent.hasResponded) {
        return {
          analytics: consent.agreed,
          getRewards: consent.agreed
        };
      }

      return { analytics: true, getRewards: true };
    }, [consent]);

    const { control, watch, register, handleSubmit, errors, triggerValidation, formState, setValue, reset } =
      useForm<FormData>({
        defaultValues: {
          password: '',
          repeatPassword: '',
          ...defaultCheckboxValues
        },
        mode: 'onChange'
      });
    const submitting = formState.isSubmitting;
    const wasSubmitted = formState.submitCount > 0;

    const {
      password: passwordValue,
      repeatPassword: repeatPasswordValue,
      analytics: analyticsEnabled,
      getRewards: rewardsEnabled
    } = watch();

    const passwordValidation = useMemo(
      () =>
        Object.fromEntries(
          Object.entries(passwordValidationRegexes).map(([key, regex]) => [key, regex.test(passwordValue ?? '')])
        ) as PasswordValidation,
      [passwordValue]
    );

    const seedPhrase = useMemo(() => mnemonicToImport ?? generateMnemonic(128), [mnemonicToImport]);

    useLayoutEffect(() => {
      if (formState.dirtyFields.has('repeatPassword')) {
        triggerValidation('repeatPassword');
      }
    }, [triggerValidation, formState.dirtyFields, passwordValue]);

    const onSubmit = useCallback(
      async (data: FormData) => {
        if (submitting) return;

        try {
          const { analytics: analyticsEnabled, getRewards: adsViewEnabled, password } = data;

          const shouldBackupToGoogleAutomatically = Boolean(googleAuthToken && !mnemonicToImport);
          setSuppressReady(shouldBackupToGoogleAutomatically);

          const accountPkh = await registerWallet(password, formatMnemonic(seedPhrase));

          dispatch(togglePartnersPromotionAction(adsViewEnabled));
          dispatch(setIsAnalyticsEnabledAction(analyticsEnabled));
          dispatch(setReferralLinksEnabledAction(adsViewEnabled));

          // registerWallet function clears async storages
          await putToStorage(REPLACE_REFERRALS_ENABLED, adsViewEnabled);
          await putToStorage(WEBSITES_ANALYTICS_ENABLED, adsViewEnabled);
          await putToStorage(SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY, false);
          await putToStorage(SHOULD_PROMOTE_ROOTSTOCK_STORAGE_KEY, false);
          await putToStorage(SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY, true);
          await putToStorage(KOLO_FORCE_LOGOUT_ON_NEXT_OPEN_STORAGE_KEY, true);

          if (adsViewEnabled && analyticsEnabled) {
            trackEvent('AnalyticsAndAdsEnabled', AnalyticsEventCategory.General, { accountPkh }, true);
          } else {
            trackEvent('AnalyticsEnabled', AnalyticsEventCategory.General, { accountPkh }, analyticsEnabled);
            trackEvent('AdsEnabled', AnalyticsEventCategory.General, { accountPkh }, adsViewEnabled);
          }

          if (IS_SIDE_PANEL_AVAILABLE) {
            await setIsSidebarByDefault(true);
            await setSideViewWasForced(true);
          }

          if (mnemonicToImport) {
            setInitToast(t(backupPassword ? 'yourWalletIsReady' : 'importSuccessful'));
            navigate('/loading');
          } else if (!googleAuthToken) {
            await putToStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, true);
            setBackupCredentials(seedPhrase, password);
            navigate('/loading');
          } else {
            try {
              await writeGoogleDriveBackup(seedPhrase, password, googleAuthToken);
              onNewBackupState?.(seedPhrase, password, true);
            } catch (e) {
              onNewBackupState?.(seedPhrase, password, false);
            }
          }
        } catch (err: any) {
          console.error(err);

          toastError(err.message);
        }
      },
      [
        submitting,
        googleAuthToken,
        mnemonicToImport,
        setSuppressReady,
        registerWallet,
        seedPhrase,
        trackEvent,
        setSideViewWasForced,
        setInitToast,
        backupPassword,
        onNewBackupState
      ]
    );

    const cleanPassword = useCallback(async () => setValue('password', '', true), [setValue]);
    const cleanRepeatPassword = useCallback(async () => setValue('repeatPassword', '', true), [setValue]);
    const fillFormForPassword = useCallback(
      (password: string) =>
        reset({
          password,
          repeatPassword: password,
          analytics: analyticsEnabled,
          getRewards: rewardsEnabled
        }),
      [analyticsEnabled, reset, rewardsEnabled]
    );

    const handleNewPasswordClick = useCallback(() => {
      fillFormForPassword('');
      goToCustomPassword();
    }, [fillFormForPassword, goToCustomPassword]);
    const handleUseBackupPasswordClick = useCallback(async () => {
      goToBackupPassword();
      fillFormForPassword(backupPassword!);
    }, [backupPassword, fillFormForPassword, goToBackupPassword]);

    const submitButtonNameI18nKey = mnemonicToImport ? 'importWallet' : 'createWallet';
    const submitButtonTestID = mnemonicToImport
      ? createPasswordSelectors.importButton
      : createPasswordSelectors.createButton;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col max-h-full">
        <PageModalScrollViewWithActions
          className="pt-4 pb-6"
          bottomEdgeThreshold={24}
          actionsBoxProps={{
            children: (
              <StyledButton size="L" color="primary" type="submit" loading={submitting} testID={submitButtonTestID}>
                <T id={submitButtonNameI18nKey} />
              </StyledButton>
            )
          }}
        >
          <div className="flex-1 flex flex-col">
            <div className="mt-1 pb-2 text-font-description h-6 flex justify-between items-center">
              <span className="font-semibold">
                <T id={backupPasswordUsed ? 'walletPassword' : 'enterYourPassword'} />
              </span>
              {backupPassword && (
                <TextButton
                  color="blue"
                  onClick={backupPasswordUsed ? handleNewPasswordClick : handleUseBackupPasswordClick}
                  testID={createPasswordSelectors.toggleBackupPasswordButton}
                >
                  <T id={backupPasswordUsed ? 'newPassword' : 'useBackupPassword'} />
                </TextButton>
              )}
            </div>
            {backupPasswordUsed && <Alert type="info" description={<T id="backupPasswordAlertText" />} />}
            <FormField
              ref={register({
                required: PASSWORD_ERROR_CAPTION,
                pattern: backupPasswordUsed
                  ? undefined
                  : {
                      value: PASSWORD_PATTERN,
                      message: PASSWORD_ERROR_CAPTION
                    }
              })}
              id="newwallet-password"
              type="password"
              name="password"
              placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
              errorCaption={errors.password?.message}
              shouldShowErrorCaption={false}
              fieldWrapperBottomMargin={false}
              cleanable={passwordValue ? passwordValue.length > 0 : false}
              containerClassName={clsx('mb-2', backupPasswordUsed && 'hidden')}
              shouldShowRevealWhenEmpty
              testID={createPasswordSelectors.passwordField}
              onClean={cleanPassword}
            />
            <div className={clsx('flex flex-wrap gap-1', backupPasswordUsed && 'hidden')}>
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
                validate: val => backupPasswordUsed || val === passwordValue || t('mustBeEqualToPasswordAbove')
              })}
              label={<T id="repeatPassword" />}
              id="newwallet-repassword"
              type="password"
              name="repeatPassword"
              placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
              errorCaption={errors.repeatPassword?.message}
              cleanable={repeatPasswordValue ? repeatPasswordValue.length > 0 : false}
              containerClassName={clsx('my-4', backupPasswordUsed && 'hidden')}
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

            {!DISABLE_ADS && (
              <Controller
                control={control}
                name="getRewards"
                as={SettingsCheckbox}
                label={<T id="earningMode" />}
                tooltip={<T id="earningModeDescription" />}
                testID={createPasswordSelectors.getRewardsCheckBox}
              />
            )}
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
        </PageModalScrollViewWithActions>
      </form>
    );
  }
);
