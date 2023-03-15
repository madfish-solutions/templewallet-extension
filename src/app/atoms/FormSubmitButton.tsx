import React, { ButtonHTMLAttributes, FC } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';

import { Button } from './Button';

type FormSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  TestIDProps & {
    loading?: boolean;
    searchingRoute?: boolean;
    small?: boolean;
  };

export const FormSubmitButton: FC<FormSubmitButtonProps> = ({
  loading,
  searchingRoute,
  small,
  disabled,
  className,
  style,
  children,
  ...rest
}) => {
  const compoundedStyle = {
    paddingTop: small ? '0.5rem' : '0.625rem',
    paddingBottom: small ? '0.5rem' : '0.625rem',
    ...style
  };
  const compoundedClassName = classNames(
    'relative flex items-center',
    'rounded border-2 font-semibold h-12',
    'transition duration-200 ease-in-out',
    small ? 'px-6' : 'px-8',
    small ? 'text-sm' : 'text-base',
    loading ? 'text-transparent' : 'text-primary-orange-lighter',
    disabled ? 'bg-gray-400 border-gray-400' : 'bg-primary-orange border-primary-orange',
    loading || disabled || searchingRoute ? 'opacity-75' : 'opacity-90 hover:opacity-100 focus:opacity-100',
    loading || disabled || searchingRoute ? 'pointer-events-none' : 'shadow-sm hover:shadow focus:shadow',
    className
  );

  if (loading) {
    return (
      <Button className={compoundedClassName} style={compoundedStyle} disabled={disabled} {...rest}>
        <div className="flex items-center justify-center">
          <Spinner theme="white" style={{ width: small ? '2rem' : '3rem' }} />
        </div>
      </Button>
    );
  }

  if (searchingRoute) {
    return (
      <Button className={compoundedClassName} style={compoundedStyle} disabled={disabled} {...rest}>
        <div className="flex items-center justify-center gap-x-2">
          <Spinner theme="white" style={{ width: small ? '2rem' : '3rem' }} />
          <span>
            <T id="searchingTheBestRoute" />
          </span>
        </div>
      </Button>
    );
  }

  return (
    <Button className={compoundedClassName} style={compoundedStyle} disabled={disabled} {...rest}>
      {children}
    </Button>
  );
};
