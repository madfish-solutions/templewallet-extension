import React, { ComponentProps, FC, HTMLAttributes } from 'react';

import { TestIDProps } from 'lib/analytics';

import CopyButton, { CopyButtonProps } from './CopyButton';
import HashShortView from './HashShortView';

type HashChipProps = HTMLAttributes<HTMLButtonElement> &
  ComponentProps<typeof HashShortView> &
  Pick<CopyButtonProps, 'small' | 'type' | 'bgShade' | 'rounded' | 'textShade'> &
  TestIDProps;

export const HashChip: FC<HashChipProps> = ({
  hash,
  trim,
  trimAfter,
  firstCharsCount,
  lastCharsCount,
  type = 'button',
  ...rest
}) => (
  <CopyButton text={hash} type={type} {...rest}>
    <HashShortView
      hash={hash}
      trimAfter={trimAfter}
      firstCharsCount={firstCharsCount}
      lastCharsCount={lastCharsCount}
    />
  </CopyButton>
);
