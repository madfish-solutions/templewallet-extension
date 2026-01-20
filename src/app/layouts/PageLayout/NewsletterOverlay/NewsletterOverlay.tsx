import React, { memo, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { object, string } from 'yup';

import { OverlayCloseButton } from 'app/atoms/OverlayCloseButton';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { shouldShowNewsletterModalAction } from 'app/store/newsletter/newsletter-actions';
import { useShouldShowNewsletterModalSelector } from 'app/store/newsletter/newsletter-selectors';
import { useOnRampAssetSelector } from 'app/store/settings/selectors';
import { setTestID } from 'lib/analytics';
import { newsletterApi } from 'lib/apis/newsletter';
import { useYupValidationResolver } from 'lib/form/use-yup-validation-resolver';
import { T } from 'lib/i18n/react';
import { useTempleClient } from 'lib/temple/front';
import { useLocation } from 'lib/woozie';
import { HOME_PAGE_PATH } from 'lib/woozie/config';

import NewsletterImage from './NewsletterImage.png';
import { NewsletterOverlaySelectors } from './NewsletterOverlay.selectors';

interface FormValues {
  email: string;
}

const validationSchema = object().shape({
  email: string().required('Required field').email('Must be a valid email')
});

// ts-prune-ignore-next
export const NewsletterOverlay = memo(() => {
  const dispatch = useDispatch();
  const { fullPage } = useAppEnv();
  const { pathname } = useLocation();

  const { ready } = useTempleClient();
  const shouldShowNewsletterModal = useShouldShowNewsletterModalSelector();
  const onRampAsset = useOnRampAssetSelector();
  const isOnRampPossibility = Boolean(onRampAsset);

  const resolver = useYupValidationResolver<FormValues>(validationSchema);

  const { formState, handleSubmit, watch, register } = useForm<FormValues>({
    defaultValues: { email: '' },
    resolver
  });
  const { errors } = formState;
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

  // TODO: remove 'ready' condition and add 'onboardingCompleted' condition when onboarding is reimplemented
  if (!shouldShowNewsletterModal || !ready || isOnRampPossibility || pathname !== HOME_PAGE_PATH) return null;

  return (
    <div className="fixed inset-0 z-overlay-promo flex flex-col items-center justify-center bg-gray-700 bg-opacity-20">
      <div className={classNames(LAYOUT_CONTAINER_CLASSNAME, 'overflow-y-scroll py-4', !fullPage && 'h-full px-4')}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={classNames(
            'relative flex flex-col justify-center text-center bg-orange-100 shadow-lg bg-no-repeat rounded-md',
            fullPage ? 'px-8 py-18' : 'p-4 h-full'
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
            <h1 className="mb-1 font-inter text-base text-gray-910 text-left">
              <T id="subscribeToNewsletter" />
            </h1>

            <span className="mb-1 text-xs text-left text-gray-600">
              <T id="keepLatestNews" />
            </span>

            <div className="w-full mb-4">
              <input
                {...register('email')}
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
