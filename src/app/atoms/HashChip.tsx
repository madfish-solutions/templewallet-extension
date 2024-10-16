import React, { ComponentProps, FC, HTMLAttributes } from 'react';

import HashShortView from './HashShortView';
import StyledCopyButton, { StyledCopyButtonProps } from './StyledCopyButton';

type HashChipProps = HTMLAttributes<HTMLButtonElement> &
  ComponentProps<typeof HashShortView> &
  Pick<StyledCopyButtonProps, 'small' | 'type' | 'bgShade' | 'rounded' | 'textShade'>;

export const HashChip: FC<HashChipProps> = ({
  hash,
  trim,
  trimAfter,
  firstCharsCount,
  lastCharsCount,
  type = 'button',
  ...rest
}) => (
  <StyledCopyButton text={hash} type={type} {...rest}>
    <HashShortView
      hash={hash}
      trimAfter={trimAfter}
      firstCharsCount={firstCharsCount}
      lastCharsCount={lastCharsCount}
    />
  </StyledCopyButton>
);
