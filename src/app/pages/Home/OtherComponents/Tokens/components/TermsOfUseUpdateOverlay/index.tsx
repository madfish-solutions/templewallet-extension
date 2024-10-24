import React, { memo, useCallback, useEffect } from 'react';

import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { FormCheckbox, FormSubmitButton } from 'app/atoms';
import { FormCheckboxGroup } from 'app/atoms/FormCheckboxGroup';
import { OverlayCloseButton } from 'app/atoms/OverlayCloseButton';
import { useAppEnv } from 'app/env';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import {
  setAcceptedTermsVersionAction,
  setReferralLinksEnabledAction,
  setShowAgreementsCounterAction
} from 'app/store/settings/actions';
import {
  MAX_SHOW_AGREEMENTS_COUNTER,
  PRIVACY_POLICY_URL,
  RECENT_TERMS_VERSION,
  REPLACE_REFERRALS_ENABLED,
  TERMS_OF_USE_URL
} from 'lib/constants';
import { t, T } from 'lib/i18n';
import { putToStorage } from 'lib/storage';

import AdvancedFeaturesIllustration from './advanced-features-illustration.png';
import IllustrationBgFull from './illustration-bg-full.png';
import IllustrationBgPopup from './illustration-bg-popup.png';
import { TermsOfUseUpdateOverlaySelectors } from './selectors';

interface FormValues {
  termsAccepted: boolean;
}

interface TermsOfUseUpdateOverlayProps {
  onClose: EmptyFn;
}

export const TermsOfUseUpdateOverlay = memo<TermsOfUseUpdateOverlayProps>(({ onClose }) => {
  const { popup } = useAppEnv();
  const dispatch = useDispatch();
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const { handleSubmit, errors, register } = useForm<FormValues>({
    defaultValues: { termsAccepted: false }
  });

  const handleClose = useCallback(() => {
    if (shouldShowPartnersPromo) {
      dispatch(setShowAgreementsCounterAction(MAX_SHOW_AGREEMENTS_COUNTER));
    }
    onClose();
  }, [dispatch, onClose, shouldShowPartnersPromo]);

  const onSubmit = useCallback(() => {
    dispatch(setAcceptedTermsVersionAction(RECENT_TERMS_VERSION));
    dispatch(setReferralLinksEnabledAction(true));
    putToStorage<boolean>(REPLACE_REFERRALS_ENABLED, true);
    handleClose();
  }, [dispatch, handleClose]);

  useEffect(() => {
    document.body.style.overflowY = 'hidden';

    return () => {
      document.body.style.overflowY = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-sticky flex flex-col items-center justify-center bg-gray-700 bg-opacity-20">
      <div
        className={clsx('w-full max-w-screen-sm mx-auto overflow-y-scroll p-4', popup ? 'w-full h-full' : 'max-h-full')}
        style={{ width: popup ? undefined : 'fit-content' }}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={clsx(
            'relative flex flex-col justify-center items-center bg-white rounded-md p-6',
            popup && 'w-full min-h-full'
          )}
          // TODO: change sizes in V2 or while making a layout for Mises
          style={{ width: popup ? undefined : 600 }}
        >
          <img
            src={popup ? IllustrationBgPopup : IllustrationBgFull}
            alt=""
            className="absolute left-1/2 transform -translate-x-1/2 h-auto"
            style={{ top: popup ? 65 : 80, width: popup ? 356 : 383 }}
          />
          <div className="w-full flex flex-col items-center z-10">
            <h1
              className={clsx(
                'mt-8 text-center font-bold text-orange-500 leading-tight z-10',
                popup ? 'text-4xl' : 'text-4xl-plus'
              )}
            >
              <T id="templeUpdate" />
            </h1>
            <span
              className="font-semibold leading-tight text-sm text-gray-700 text-center mt-4"
              style={{ maxWidth: 354 }}
            >
              <T id="templeUpdateDescription" />
            </span>
            <img
              className="mt-6 mb-9 h-auto"
              src={AdvancedFeaturesIllustration}
              alt=""
              style={{ width: 336, letterSpacing: 0.014 }}
            />
            <FormCheckboxGroup
              isError={Boolean(errors.termsAccepted)}
              className={clsx('max-w-xs', popup ? 'mt-4' : undefined)}
            >
              <FormCheckbox
                basic
                ref={register({
                  validate: val => val || t('confirmTermsError')
                })}
                name="termsAccepted"
                testID={TermsOfUseUpdateOverlaySelectors.acceptTermsCheckbox}
                labelDescription={
                  <T
                    id="acceptTermsInputDescription"
                    substitutions={[
                      <a
                        href={TERMS_OF_USE_URL}
                        key="termsLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-secondary"
                      >
                        <T id="termsOfUsage" />
                      </a>,
                      <a
                        href={PRIVACY_POLICY_URL}
                        key="privacyPolicyLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-secondary"
                      >
                        <T id="privacyPolicy" />
                      </a>
                    ]}
                  />
                }
              />
            </FormCheckboxGroup>
            <FormSubmitButton className="mt-3 w-full max-w-xs" disabled={Object.keys(errors).length > 0}>
              <T id="continue" />
            </FormSubmitButton>
            <OverlayCloseButton onClick={handleClose} />
          </div>
        </form>
      </div>
    </div>
  );
});
