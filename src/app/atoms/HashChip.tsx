import React, { ComponentProps, FC } from 'react';

import clsx from 'clsx';

import { getStyledButtonColorsClassNames } from 'lib/ui/use-styled-button-or-link-props';

import { CopyButton, CopyButtonProps } from './CopyButton';
import HashShortView from './HashShortView';

type HashChipProps = Omit<CopyButtonProps, 'text'> & ComponentProps<typeof HashShortView>;

export const HashChip: FC<HashChipProps> = ({
  hash,
  trim,
  trimAfter,
  firstCharsCount,
  lastCharsCount,
  className,
  ...rest
}) => (
  <CopyButton
    text={hash}
    className={clsx(
      getStyledButtonColorsClassNames('secondary-low'),
      'select-none transition ease-in-out duration-300',
      'text-font-description px-1 py-0.5 rounded',
      className
    )}
    {...rest}
  >
    <HashShortView
      hash={hash}
      trimAfter={trimAfter}
      firstCharsCount={firstCharsCount}
      lastCharsCount={lastCharsCount}
    />
  </CopyButton>
);
