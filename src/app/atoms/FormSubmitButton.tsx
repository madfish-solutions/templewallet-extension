import React, { FC } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { setAnotherSelector } from 'lib/analytics';

import { ButtonProps, Button } from './Button';

interface FormSubmitButtonProps extends ButtonProps {
  keepChildrenWhenLoading?: boolean;
  loading?: boolean;
  small?: boolean;
  textClassNames?: string;
}

export const FormSubmitButton: FC<FormSubmitButtonProps> = ({
  loading,
  keepChildrenWhenLoading,
  small,
  disabled,
  className,
  style,
  textClassNames,
  children,
  ...rest
}) => {
  const compoundedStyle = {
    paddingTop: small ? '0.5rem' : '0.625rem',
    paddingBottom: small ? '0.5rem' : '0.625rem',
    ...style
  };

  const compoundedClassName = classNames(
    'relative flex items-center justify-center h-12 gap-x-2',
    'text-primary-orange-lighter font-semibold rounded border-2',
    'transition duration-200 ease-in-out',
    small ? 'px-6 text-sm' : 'px-8 text-base',
    disabled ? 'bg-gray-400 border-gray-400' : 'bg-primary-orange border-primary-orange',
    loading || disabled
      ? 'opacity-75 pointer-events-none'
      : 'opacity-90 hover:opacity-100 focus:opacity-100 shadow-sm hover:shadow focus:shadow',
    className
  );

  if (loading) {
    return (
      <Button
        className={compoundedClassName}
        style={compoundedStyle}
        disabled={disabled}
        {...rest}
        {...setAnotherSelector('loading', '')}
      >
        <Spinner theme="white" style={{ width: small ? '2rem' : '3rem' }} />
        {keepChildrenWhenLoading && children}
      </Button>
    );
  }

  return (
    <Button className={compoundedClassName} style={compoundedStyle} disabled={disabled} {...rest}>
      {children}
    </Button>
  );
};
