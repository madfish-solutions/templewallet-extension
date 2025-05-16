import React, { FC, FunctionComponent, SVGProps } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { TestIDProps } from 'lib/analytics';

interface OnRumpSmileButtonProps extends TestIDProps {
  SmileIcon: FunctionComponent<SVGProps<SVGSVGElement>>;
  amount: number;
  className?: string;
  titleClassName?: string;
  onClick?: EmptyFn;
}

export const OnRampSmileButton: FC<OnRumpSmileButtonProps> = ({
  SmileIcon,
  amount,
  className,
  titleClassName,
  onClick,
  testID
}) => {
  const { popup } = useAppEnv();

  return (
    <Button
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
      onClick={onClick}
      testID={testID}
    >
      <SmileIcon className="w-7 h-auto" />
      <p
        className={classNames('font-inter font-semibold text-orange-500 mt-1', titleClassName)}
        style={{ fontSize: '1.188rem' }}
      >
        {amount}$
      </p>
    </Button>
  );
};
