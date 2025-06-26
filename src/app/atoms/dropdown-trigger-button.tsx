import React, { forwardRef, memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';

import { Button, ButtonProps } from './Button';
import { IconBase } from './IconBase';

interface DropdownTriggerButtonProps extends ButtonProps {
  iconClassName?: string;
}

export const DropdownTriggerButton = memo(
  forwardRef<HTMLButtonElement, DropdownTriggerButtonProps>(
    ({ className, iconClassName = 'text-primary', children, onClick, style, ...restProps }, ref) => (
      <Button
        className={clsx(
          'flex items-center rounded-lg shadow-bottom',
          onClick && 'justify-between border-0.5 border-transparent hover:border-lines',
          className
        )}
        style={{ cursor: onClick ? 'pointer' : 'auto', ...style }}
        ref={ref}
        onClick={onClick}
        {...restProps}
      >
        {children}

        {onClick && <IconBase Icon={CompactDown} className={iconClassName} size={16} />}
      </Button>
    )
  )
);
