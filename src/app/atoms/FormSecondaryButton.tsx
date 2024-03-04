import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';

import { Button, ButtonProps } from './Button';

interface FormSecondaryButtonProps extends ButtonProps {
  keepChildrenWhenLoading?: boolean;
  loading?: boolean;
  small?: boolean;
  slim?: boolean;
  rounder?: boolean;
}

export const FormSecondaryButton: FC<FormSecondaryButtonProps> = ({
  keepChildrenWhenLoading,
  loading,
  small,
  slim = small,
  rounder,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}) => {
  const classNameMemo = useMemo(
    () =>
      classNames(
        'relative flex items-center justify-center',
        'bg-white border-2 font-semibold',
        'transition duration-200 ease-in-out',
        rounder ? 'rounded-md' : 'rounded',
        small ? 'px-6 text-sm' : 'px-8 text-base',
        slim ? 'h-9 py-1.5' : 'h-12 py-2',
        disabled ? 'text-gray-350 border-gray-350' : 'text-primary-orange border-primary-orange',
        loading || disabled
          ? 'opacity-75 shadow-inner cursor-default'
          : 'opacity-90 hover:opacity-100 shadow-sm hover:shadow focus:shadow',
        className
      ),
    [disabled, loading, className, small, slim, rounder]
  );

  return (
    <Button type={type} className={classNameMemo} disabled={disabled} {...rest}>
      {loading ? keepChildrenWhenLoading && children : children}

      {loading && <Spinner theme="primary" className={small ? 'w-8' : 'w-12'} />}
    </Button>
  );
};
