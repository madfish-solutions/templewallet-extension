import React, { ComponentProps, FC, HTMLAttributes } from 'react';

import HashShortView from './HashShortView';
import OldStyleCopyButton, { OldStyleCopyButtonProps } from './OldStyleCopyButton';

type HashChipProps = HTMLAttributes<HTMLButtonElement> &
  ComponentProps<typeof HashShortView> &
  Pick<OldStyleCopyButtonProps, 'small' | 'type' | 'bgShade' | 'rounded' | 'textShade'>;

/** @deprecated */
export const OldStyleHashChip: FC<HashChipProps> = ({
  hash,
  trim,
  trimAfter,
  firstCharsCount,
  lastCharsCount,
  type = 'button',
  ...rest
}) => (
  <OldStyleCopyButton text={hash} type={type} {...rest}>
    <HashShortView
      hash={hash}
      trimAfter={trimAfter}
      firstCharsCount={firstCharsCount}
      lastCharsCount={lastCharsCount}
    />
  </OldStyleCopyButton>
);
