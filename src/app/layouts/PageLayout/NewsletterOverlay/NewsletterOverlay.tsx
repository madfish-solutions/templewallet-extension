import React, { memo, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { object, string } from 'yup';

import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { useOnboardingProgress } from 'app/pages/Onboarding/hooks/useOnboardingProgress.hook';
import { shouldShowNewsletterModalAction } from 'app/store/newsletter/newsletter-actions';
import { useShouldShowNewsletterModalSelector } from 'app/store/newsletter/newsletter-selectors';
import { useOnRampPossibilitySelector } from 'app/store/settings/selectors';
import { setTestID } from 'lib/analytics';
import { newsletterApi } from 'lib/apis/newsletter';
import { useYupValidationResolver } from 'lib/form/use-yup-validation-resolver';
import { t } from 'lib/i18n/react';
import { useLocation } from 'lib/woozie';
import { HOME_PAGE_PATH } from 'lib/woozie/config';

import { OverlayCloseButton } from '../OverlayCloseButton';

import NewsletterImage from './NewsletterImage.png';
import { NewsletterOverlaySelectors } from './NewsletterOverlay.selectors';

interface FormValues {
  email: string;
}

const validationSchema = object().shape({
  email: string().required('Required field').email('Must be a valid email')
});

export const NewsletterOverlay = memo(() => {
  const dispatch = useDispatch();
  const { popup } = useAppEnv();
  const { pathname } = useLocation();

  const { onboardingCompleted } = useOnboardingProgress();
  const shouldShowNewsletterModal = useShouldShowNewsletterModalSelector();
  const isOnRampPossibility = useOnRampPossibilitySelector();

  const validationResolver = useYupValidationResolver<FormValues>(validationSchema);

  const { errors, handleSubmit, watch, register } = useForm<FormValues>({
    defaultValues: { email: '' },
    validationResolver
  });
  const email = watch('email');
  const isValid = Object.keys(errors).length === 0;

  const [isLoading, setIsLoading] = useState(false);
  const [successSubscribing, setSuccessSubscribing] = useState(false);

  const close = () => void dispatch(shouldShowNewsletterModalAction(false));

  const onSubmit = () => {
    setIsLoading(true);
    newsletterApi
      .post('/', {
        NAME: email,
        EMAIL: email
      })
      .then(() => {
        setSuccessSubscribing(true);
        dispatch(shouldShowNewsletterModalAction(false));
      })
      .finally(() => setIsLoading(false));
  };

  const buttonContent = useMemo(() => {
    if (successSubscribing) {
      return 'Thanks for your subscribing!';
    }

    if (isLoading) {
      return <Spinner theme="white" className="w-8" />;
    }

    return 'Subscribe';
  }, [successSubscribing, isLoading]);

  if (!shouldShowNewsletterModal || !onboardingCompleted || isOnRampPossibility || pathname !== HOME_PAGE_PATH)
    return null;

  return (
    <div className="fixed inset-0 z-overlay-promo flex flex-col items-center justify-center bg-gray-700 bg-opacity-20">
      <div className={classNames(LAYOUT_CONTAINER_CLASSNAME, 'overflow-y-scroll py-4', popup && 'h-full px-4')}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={classNames(
            'relative flex flex-col justify-center text-center bg-orange-100 shadow-lg bg-no-repeat rounded-md',
            popup ? 'p-4 h-full' : 'px-8 py-18'
          )}
        >
          <OverlayCloseButton testID={NewsletterOverlaySelectors.closeButton} onClick={close} />

          <img
            src={NewsletterImage}
            style={{ maxHeight: '375px', maxWidth: '496px' }}
            className="mb-4"
            alt="Newsletter"
          />

          <div className="flex flex-col w-full max-w-sm mx-auto">
            <h1 className="mb-1 font-inter text-base text-gray-910 text-left">{t('subscribeToNewsletter')}</h1>

            <span className="mb-1 text-xs text-left text-gray-600">{t('keepLatestNews')}</span>

            <div className="w-full mb-4">
              <input
                ref={register()}
                name="email"
                className="w-full max-h-13 p-4 rounded-md border text-sm text-gray-910"
                placeholder="example@mail.com"
                {...setTestID(NewsletterOverlaySelectors.emailInput)}
              />
              {!isValid && <div className="mt-1 text-xs text-left text-red-700">{errors.email?.message}</div>}
            </div>

            <button
              disabled={!isValid}
              type="submit"
              className={classNames(
                'w-full h-12 flex items-center justify-center font-semibold rounded-md text-base px-16 py-3 text-white',
                isValid ? 'bg-orange-500' : 'bg-blue-100'
              )}
              {...setTestID(NewsletterOverlaySelectors.subscribeButton)}
            >
              {buttonContent}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
