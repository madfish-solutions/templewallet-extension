import React, { FC, useMemo } from 'react';

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
  textClassNames,
  children,
  ...rest
}) => {
  const classNameMemo = classNames(
    'relative flex items-center justify-center h-12 gap-x-2',
    'text-primary-orange-lighter font-semibold rounded border-2',
    'transition duration-200 ease-in-out',
    small ? 'px-6 py-2 text-sm' : 'px-8 py-2.5 text-base',
    disabled ? 'bg-gray-400 border-gray-400' : 'bg-primary-orange border-primary-orange',
    loading || disabled
      ? 'opacity-75 pointer-events-none'
      : 'opacity-90 hover:opacity-100 focus:opacity-100 shadow-sm hover:shadow focus:shadow',
    className
  );

  const otherProps = useMemo(() => (loading ? setAnotherSelector('loading', '') : null), [loading]);

  return (
    <Button className={classNameMemo} disabled={disabled} {...rest} {...otherProps}>
      {loading && <Spinner theme="white" style={{ width: small ? '2rem' : '3rem' }} />}

      {loading ? keepChildrenWhenLoading && children : children}
    </Button>
  );
};
