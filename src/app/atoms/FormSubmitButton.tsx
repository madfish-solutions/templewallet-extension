import React, { FC } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';

import { ButtonProps, Button } from './Button';

interface FormSubmitButtonProps extends ButtonProps {
  loading?: boolean;
  small?: boolean;
}

export const FormSubmitButton: FC<FormSubmitButtonProps> = ({
  loading,
  small,
  disabled,
  className,
  style,
  children,
  ...rest
}) => (
  <Button
    className={classNames(
      'relative flex items-center rounded border-2 font-semibold',
      small ? 'px-6 text-sm' : 'px-8 text-base',
      disabled ? 'bg-gray-400 border-gray-400' : 'bg-primary-orange border-primary-orange',
      loading ? 'text-transparent' : 'text-primary-orange-lighter',
      'transition duration-200 ease-in-out',
      loading || disabled ? 'opacity-75' : 'opacity-90 hover:opacity-100 focus:opacity-100',
      loading || disabled ? 'pointer-events-none' : 'shadow-sm hover:shadow focus:shadow',
      className
    )}
    style={{
      paddingTop: small ? '0.5rem' : '0.625rem',
      paddingBottom: small ? '0.5rem' : '0.625rem',
      ...style
    }}
    disabled={disabled}
    {...rest}
  >
    {children}

    {loading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <Spinner theme="white" style={{ width: small ? '2rem' : '3rem' }} />
      </div>
    )}
  </Button>
);
