import React, { memo } from 'react';

import clsx from 'clsx';

import { StyledButton, StyledButtonProps } from '../StyledButton';

export const ActionModalButton = memo<Omit<StyledButtonProps, 'size'>>(({ className, ...restProps }) => (
  <StyledButton size="L" className={clsx('flex-1', className)} {...restProps} />
));
