import React, { ButtonHTMLAttributes, FC, useMemo } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import { TestIDProps } from 'lib/analytics';

import { Button } from './Button';

type FormSecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  TestIDProps & {
    loading?: boolean;
    small?: boolean;
  };

export const FormSecondaryButton: FC<FormSecondaryButtonProps> = ({
  loading,
  small,
  type = 'button',
  disabled,
  className,
  style,
  children,
  ...rest
}) => {
  const classNameMemo = useMemo(
    () =>
      classNames(
        'relative flex items-center',
        'bg-white rounded border-2 border-primary-orange font-semibold',
        'transition duration-200 ease-in-out',
        small ? 'px-6 py-2 text-sm' : 'px-8 py-2.5 text-base',
        loading ? 'text-transparent' : 'text-primary-orange',
        loading || disabled
          ? 'opacity-75 shadow-inner pointer-events-none'
          : 'opacity-90 hover:opacity-100 shadow-sm hover:shadow focus:shadow',
        className
      ),
    [small, loading, disabled, className]
  );

  return (
    <Button type={type} className={classNameMemo} style={style} disabled={disabled} {...rest}>
      {children}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner theme="primary" style={{ width: small ? '2rem' : '3rem' }} />
        </div>
      )}
    </Button>
  );
};
