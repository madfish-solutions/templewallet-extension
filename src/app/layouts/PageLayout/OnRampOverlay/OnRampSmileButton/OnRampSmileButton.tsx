import React, { FC } from 'react';

import classNames from 'clsx';

import { Anchor } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { TestIDProps } from 'lib/analytics';

interface OnRumpSmileButtonProps extends TestIDProps {
  smile: string;
  amount: number;
  className?: string;
  titleClassName?: string;
}

export const OnRampSmileButton: FC<OnRumpSmileButtonProps> = ({ smile, amount, className, titleClassName, testID }) => {
  const { popup } = useAppEnv();

  return (
    <Anchor
      className={classNames(
        'flex flex-col',
        'justify-center items-center',
        'bg-white rounded-lg',
        'shadow-md hover:bg-gray-100',
        'transition ease-in-out duration-200',
        'cursor-pointer',
        className
      )}
      style={{ height: '5.438rem', width: popup ? '5.5rem' : '8.75rem' }}
      testID={testID}
    >
      <span className="h-7 text-2xl-plus">{smile}</span>
      <p
        className={classNames('font-inter', 'font-semibold text-orange-500', 'mt-2', titleClassName)}
        style={{ fontSize: '1.188rem' }}
      >
        {amount}$
      </p>
    </Anchor>
  );
};
