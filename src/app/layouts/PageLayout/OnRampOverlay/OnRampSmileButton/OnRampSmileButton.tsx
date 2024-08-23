import React, { FC, FunctionComponent, SVGProps } from 'react';

import classNames from 'clsx';

import { Anchor } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { TestIDProps } from 'lib/analytics';

interface OnRumpSmileButtonProps extends TestIDProps {
  href: string;
  SmileIcon: FunctionComponent<SVGProps<SVGSVGElement>>;
  amount: number;
  accentColors?: boolean;
  onClick?: () => void;
}

export const OnRampSmileButton: FC<OnRumpSmileButtonProps> = ({
  href,
  SmileIcon,
  amount,
  accentColors,
  onClick,
  testID
}) => {
  const { popup } = useAppEnv();

  return (
    <Anchor
      href={href}
      className={classNames(
        'flex flex-col',
        'justify-center items-center',
        'rounded-lg shadow-md',
        'transition ease-in-out duration-200',
        'cursor-pointer',
        accentColors ? 'hover:shadow hover:opacity-90 hover:bg-orange-500 bg-orange-500' : 'bg-white hover:bg-gray-100'
      )}
      style={{ height: '5.438rem', width: popup ? '5.5rem' : '8.75rem' }}
      onClick={onClick}
      testID={testID}
    >
      <SmileIcon className="w-7 h-auto" />
      <p
        className={classNames('font-inter font-semibold mt-1', accentColors ? 'text-primary-white' : 'text-orange-500')}
        style={{ fontSize: '1.188rem' }}
      >
        {amount}$
      </p>
    </Anchor>
  );
};
