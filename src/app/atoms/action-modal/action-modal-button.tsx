import React, { memo } from 'react';

import clsx from 'clsx';

import { StyledButton, StyledButtonProps } from '../StyledButton';

type ActionModalButtonProps = PropsWithChildren<
  Pick<StyledButtonProps, 'className' | 'disabled' | 'onClick' | 'type' | 'color' | 'testID' | 'testIDProperties'>
>;

export const ActionModalButton = memo<ActionModalButtonProps>(
  ({ className, color, disabled, onClick, type, children }) => (
    <StyledButton
      size="L"
      color={color}
      disabled={disabled}
      className={clsx('flex-1', className)}
      onClick={onClick}
      type={type}
    >
      {children}
    </StyledButton>
  )
);
