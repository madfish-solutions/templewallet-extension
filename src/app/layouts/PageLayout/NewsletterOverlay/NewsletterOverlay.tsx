import React, { FC, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { object, string } from 'yup';

import { Button } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { shouldShowNewsletterModalAction } from 'app/store/newsletter/newsletter-actions';
import { useShouldShowNewsletterModalSelector } from 'app/store/newsletter/newsletter-selectors';
import { useOnRampPossibilitySelector } from 'app/store/settings/selectors';
import { setTestID } from 'lib/analytics';
import { newsletterApi } from 'lib/apis/newsletter';
import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY } from 'lib/constants';
import { useYupValidationResolver } from 'lib/form/use-yup-validation-resolver';
import { T, t } from 'lib/i18n/react';
import { useStorage, useTempleClient } from 'lib/temple/front';
import { useLocation } from 'lib/woozie';

import NewsletterImage from './NewsletterImage.png';
import { NewsletterOverlaySelectors } from './NewsletterOverlay.selectors';

interface FormValues {
  email: string;
}

const validationSchema = object().shape({
  email: string().required('Required field').email('Must be a valid email')
});

const HOME_PAGE_PATH = '/';

export const NewsletterOverlay: FC = () => {
  const dispatch = useDispatch();
  const { popup } = useAppEnv();
  const { pathname } = useLocation();

  const { ready } = useTempleClient();
  const shouldShowNewsletterModal = useShouldShowNewsletterModalSelector();
  const isOnRampPossibility = useOnRampPossibilitySelector();
  const [shouldBackupMnemonic] = useStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, false);

  const validationResolver = useYupValidationResolver<FormValues>(validationSchema);

  const { errors, handleSubmit, watch, register } = useForm<FormValues>({
    defaultValues: { email: '' },
    validationResolver
  });
  const email = watch('email');
  const isValid = Object.keys(errors).length === 0;

  const [isLoading, setIsLoading] = useState(false);
  const [successSubscribing, setSuccessSubscribing] = useState(false);

  const popupClassName = useMemo(
    () => (popup ? 'inset-0 p-4' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2'),
    [popup]
  );
  const closeButtonClassName = useMemo(() => (popup ? 'top-8 right-8' : 'top-4 right-4'), [popup]);
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
  if (
    !shouldShowNewsletterModal ||
    !ready ||
    isOnRampPossibility ||
    shouldBackupMnemonic ||
    pathname !== HOME_PAGE_PATH
  )
    return null;

  return (
    <>
      <div className="fixed inset-0 z-overlay-promo opacity-20 bg-gray-700"></div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          className={classNames(LAYOUT_CONTAINER_CLASSNAME, 'fixed z-overlay-promo overflow-y-scroll', popupClassName)}
          style={{ maxWidth: '37.5rem', maxHeight: 'calc(100vh - 50px)' }}
        >
          <div
            className={classNames(
              'flex flex-col justify-center text-center bg-orange-100 shadow-lg bg-no-repeat rounded-md',
              popup ? 'p-4' : 'px-13 py-18'
            )}
            style={{ height: popup ? '100%' : '700px' }}
          >
            <Button
              className={classNames(
                'absolute w-24 h-9 uppercase bg-blue-500',
                'font-inter text-white',
                'text-sm font-medium rounded',
                'flex flex-row justify-center items-center self-end',
                'hover:opacity-90',
                closeButtonClassName
              )}
              onClick={close}
              testID={NewsletterOverlaySelectors.closeButton}
            >
              <T id="close" />
              <CloseIcon className="ml-2 h-4 w-auto stroke-current stroke-2" />
            </Button>
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
          </div>
        </div>
      </form>
    </>
  );
};
