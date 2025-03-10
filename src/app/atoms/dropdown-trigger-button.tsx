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
    ({ className, iconClassName = 'text-primary', children, ...restProps }, ref) => (
      <Button
        className={clsx(
          'flex justify-between items-center rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines',
          className
        )}
        ref={ref}
        {...restProps}
      >
        {children}

        <IconBase Icon={CompactDown} className={iconClassName} size={16} />
      </Button>
    )
  )
);
