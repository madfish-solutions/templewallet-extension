import { Ref, memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';

import { Button, ButtonProps } from './Button';
import { IconBase } from './IconBase';

interface DropdownTriggerButtonProps extends ButtonProps {
  iconClassName?: string;
  ref?: Ref<HTMLButtonElement>;
}

export const DropdownTriggerButton = memo<DropdownTriggerButtonProps>(
  ({ className, iconClassName = 'text-primary', children, onClick, style, ref, ...restProps }) => {
    return (
      <Button
        className={clsx(
          'flex items-center rounded-8 border-0.5 bg-white border-lines',
          onClick && 'justify-between hover:bg-background',
          className
        )}
        style={{ cursor: onClick ? 'pointer' : 'auto', ...style }}
        ref={ref}
        onClick={onClick}
        {...restProps}
      >
        {children}

        {onClick && <IconBase Icon={CompactDown} className={iconClassName} />}
      </Button>
    );
  }
);
