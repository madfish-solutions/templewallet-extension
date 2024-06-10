import React, { memo } from 'react';

import clsx from 'clsx';

import { Button, ButtonProps } from 'app/atoms/Button';

type ActionModalButtonProps = Pick<ButtonProps, 'className' | 'disabled' | 'onClick' | 'type' | 'children'>;

const modalActionButtonClassName = 'flex-1 p-2 text-center text-font-regular-bold rounded-lg';

export const ActionModalButton = memo<ActionModalButtonProps>(({ className, disabled, onClick, type, children }) => (
  <Button
    disabled={disabled}
    className={clsx(modalActionButtonClassName, className, disabled && 'opacity-75 pointer-events-none')}
    onClick={onClick}
    type={type}
  >
    {children}
  </Button>
));
