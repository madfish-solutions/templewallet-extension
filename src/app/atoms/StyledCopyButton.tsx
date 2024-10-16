import React, { FC, HTMLAttributes, useMemo } from 'react';

import classNames from 'clsx';

import { TestIDProps } from 'lib/analytics';

import { CopyButton } from './CopyButton';

const TEXT_SHADES = {
  100: 'text-secondary',
  500: 'text-gray-500',
  600: 'text-gray-600',
  700: 'text-gray-700'
};

const BG_SHADES = {
  50: 'bg-secondary-low hover:bg-secondary-hover-low',
  100: 'bg-gray-100 hover:bg-gray-200',
  200: 'bg-gray-200 hover:bg-gray-300'
};

export type StyledCopyButtonProps = HTMLAttributes<HTMLButtonElement> &
  TestIDProps & {
    bgShade?: 50 | 100 | 200;
    rounded?: 'sm' | 'base';
    text: string;
    small?: boolean;
    type?: 'button' | 'link';
    textShade?: 100 | 500 | 600 | 700;
    isSecret?: boolean;
  };

const StyledCopyButton: FC<StyledCopyButtonProps> = ({
  bgShade = 100,
  children,
  text,
  small = false,
  className,
  type = 'button',
  rounded = 'sm',
  textShade = 600,
  testID,
  testIDProperties,
  isSecret,
  ...rest
}) => {
  const classNameMemo = useMemo(
    () =>
      type === 'button'
        ? classNames(
            'font-tnum leading-none select-none',
            'transition ease-in-out duration-300',
            rounded === 'base' ? 'rounded' : 'rounded-sm',
            small ? 'text-font-description p-1' : 'text-font-medium py-1 px-2',
            BG_SHADES[bgShade],
            TEXT_SHADES[textShade],
            className
          )
        : classNames('hover:underline', className),
    [type, className, rounded, small, bgShade, textShade]
  );

  return (
    <CopyButton
      text={text}
      isSecret={isSecret}
      shouldShowTooltip
      testID={testID}
      testIDProperties={testIDProperties}
      className={classNameMemo}
      {...rest}
    >
      {children}
    </CopyButton>
  );
};

export default StyledCopyButton;
