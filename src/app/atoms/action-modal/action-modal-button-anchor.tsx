import { memo } from 'react';

import clsx from 'clsx';

import { StyledButtonAnchor, StyledButtonAnchorProps } from '../StyledButton';

export const ActionModalButtonAnchor = memo<Omit<StyledButtonAnchorProps, 'size'>>(({ className, ...restProps }) => (
  <StyledButtonAnchor size="L" className={clsx('flex-1', className)} {...restProps} />
));
