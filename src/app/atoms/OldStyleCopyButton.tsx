import React, { FC, HTMLAttributes, useMemo } from 'react';

import classNames from 'clsx';

import { TestIDProps } from 'lib/analytics';

import { CopyButton } from './CopyButton';

const TEXT_SHADES = {
  500: 'text-gray-500',
  600: 'text-gray-600',
  700: 'text-gray-700'
};

const BG_SHADES = {
  100: 'bg-gray-100 hover:bg-gray-200',
  200: 'bg-gray-200 hover:bg-gray-300'
};

/** @deprecated */
export type OldStyleCopyButtonProps = HTMLAttributes<HTMLButtonElement> &
  TestIDProps & {
    bgShade?: 100 | 200;
    rounded?: 'sm' | 'base';
    text: string;
    small?: boolean;
    type?: 'button' | 'link';
    textShade?: 500 | 600 | 700;
    isSecret?: boolean;
  };

/** @deprecated */
const OldStyleCopyButton: FC<OldStyleCopyButtonProps> = ({
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
            rounded === 'base' ? 'rounded' : 'rounded-xs',
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

export default OldStyleCopyButton;
