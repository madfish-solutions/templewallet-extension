import React, { FC, FunctionComponent, SVGProps } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import { TestIDProps } from 'lib/analytics';

interface OnRumpSmileButtonProps extends TestIDProps {
  SmileIcon: FunctionComponent<SVGProps<SVGSVGElement>>;
  amount: number;
  accentColors?: boolean;
  onClick?: EmptyFn;
}

export const OnRampSmileButton: FC<OnRumpSmileButtonProps> = ({ SmileIcon, amount, accentColors, onClick, testID }) => {
  return (
    <Button
      className={clsx(
        'flex flex-col py-[18px] flex-1 ',
        'justify-center items-center',
        'rounded-10 shadow-md',
        'transition ease-in-out duration-200',
        'cursor-pointer',
        accentColors ? 'hover:shadow hover:opacity-90 hover:bg-primary-hover bg-primary' : 'bg-white hover:bg-gray-100'
      )}
      onClick={onClick}
      testID={testID}
    >
      <SmileIcon className="w-7 h-auto" />
      <p className={clsx('text-base font-rubik font-medium mt-1', accentColors ? 'text-white' : 'text-primary')}>
        {amount}$
      </p>
    </Button>
  );
};
