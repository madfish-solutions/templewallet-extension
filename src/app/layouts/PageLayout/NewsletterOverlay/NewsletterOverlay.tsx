import React, { FC, useMemo, useEffect, useState } from 'react';

import axios from 'axios';
import classNames from 'clsx';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { object, string } from 'yup';

import { Button } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { addNewsletterEmailAction, shouldShowNewsletterModalAction } from 'app/store/newsletter/newsletter-actions';
import {
  useNewsletterEmailsSelector,
  useShouldShowNewsletterModalSelector
} from 'app/store/newsletter/newsletter-selectors';
import { useYupValidationResolver } from 'lib/form/use-yup-validation-resolver';
import { T } from 'lib/i18n/react';

import NewsletterImage from './NewsletterImage.png';

interface FormValues {
  email: string;
}

export const newsletterApi = axios.create({
  baseURL: 'https://jellyfish-app-deove.ondigitalocean.app/'
});

const useNewsletterValidation = () => {
  const emails = useNewsletterEmailsSelector();

  return object({
    email: string()
      .required('Required field')
      .notOneOf(emails, 'You have already subscribed to the newsletter with this email ')
      .email('Must be a valid email')
  });
};

export const NewsletterOverlay: FC = () => {
  const dispatch = useDispatch();
  const { popup } = useAppEnv();
  const shouldShowNewsletterModal = useShouldShowNewsletterModalSelector();
  const validationSchema = useNewsletterValidation();

  const validationResolver = useYupValidationResolver<FormValues>(validationSchema);

  const { errors, handleSubmit, watch, register } = useForm<FormValues>({
    defaultValues: { email: '' },
    mode: 'onChange',
    validationResolver
  });
  const email = watch('email');
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => console.log('email: ', email), [email]);
  console.log('email: ', email);
  console.log('errors: ', errors);

  const [isLoading, setIsLoading] = useState(false);
  const [successSubscribing, setSuccessSubscribing] = useState(false);

  const popupClassName = useMemo(
    () => (popup ? 'inset-0 p-4' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2'),
    [popup]
  );
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
        dispatch(addNewsletterEmailAction(email));
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

  if (!shouldShowNewsletterModal) return null;

  return (
    <>
      <div className="fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50"></div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ContentContainer
          className={classNames('fixed z-50 overflow-y-auto', popupClassName)}
          style={{ maxWidth: '37.5rem' }}
          padding={false}
        >
          <div
            className={classNames(
              'flex flex-col text-center bg-orange-100 shadow-lg bg-no-repeat rounded-md p-6',
              popup && 'h-full'
            )}
          >
            <Button
              className={classNames(
                'w-24 h-9 uppercase bg-blue-500',
                'font-inter text-white',
                'text-sm font-medium rounded',
                'flex flex-row justify-center items-center self-end',
                'hover:opacity-90 relative'
              )}
              style={{ top: '-0.75rem', right: '-0.75rem' }}
              onClick={close}
            >
              <T id="close" />
              <CloseIcon className="ml-2 h-4 w-auto stroke-current stroke-2" />
            </Button>
            <img src={NewsletterImage} className="mb-4" alt="Newsletter" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '384px',
                margin: '0 auto',
                width: '100%'
              }}
            >
              <h1 className="mb-1 font-inter text-base text-gray-910 text-left">Subscribe to our Newsletter</h1>
              <span className="mb-1 text-xs text-left text-gray-600">Keep up with the latest news from Madfish</span>
              <div className="w-full mb-4">
                <input
                  ref={register}
                  name="email"
                  className="w-full p-4 rounded-md border text-sm text-gray-910"
                  placeholder="example@mail.com"
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
              >
                {buttonContent}
              </button>
            </div>
          </div>
        </ContentContainer>
      </form>
    </>
  );
};
