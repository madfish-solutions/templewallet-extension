import React, { FC, useMemo } from 'react';

import clsx from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { setAnotherSelector } from 'lib/analytics';

import { ButtonProps, Button } from './Button';

interface FormSubmitButtonProps extends ButtonProps {
  keepChildrenWhenLoading?: boolean;
  loading?: boolean;
  small?: boolean;
  slim?: boolean;
  unsetHeight?: boolean;
  rounder?: boolean;
}

export const FormSubmitButton: FC<FormSubmitButtonProps> = ({
  loading,
  keepChildrenWhenLoading,
  small,
  slim = small,
  unsetHeight,
  rounder,
  disabled,
  className,
  children,
  ...rest
}) => {
  const classNameMemo = useMemo(
    () =>
      clsx(
        'relative flex items-center justify-center gap-x-2',
        'text-primary-orange-lighter font-semibold border-2',
        'transition duration-200 ease-in-out',
        rounder ? 'rounded-md' : 'rounded',
        small ? 'px-6 text-sm' : 'px-8 text-base leading-5',
        !unsetHeight && (slim ? 'h-9 py-1.5' : 'h-12 py-2'),
        disabled ? 'bg-gray-400 border-gray-400' : 'bg-primary-orange border-primary-orange',
        loading || disabled
          ? 'opacity-75 pointer-events-none'
          : 'opacity-90 hover:opacity-100 focus:opacity-100 shadow-sm hover:shadow focus:shadow',
        className
      ),
    [disabled, loading, className, small, slim, unsetHeight, rounder]
  );

  const otherProps = useMemo(() => (loading ? setAnotherSelector('loading', '') : null), [loading]);

  return (
    <Button className={classNameMemo} disabled={disabled} {...rest} {...otherProps}>
      {loading && <Spinner theme="white" className={small ? 'w-8' : 'w-12'} />}

      {loading ? keepChildrenWhenLoading && children : children}
    </Button>
  );
};
