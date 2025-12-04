import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CircleIcon } from 'app/icons/base/circle.svg';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';

import { IconBase } from './IconBase';

type RadioButtonVariant = 'icon' | 'dot';

interface Props {
  active: boolean;
  className?: string;
  variant?: RadioButtonVariant;
}

export const RadioButton = memo<Props>(({ active, className, variant = 'icon' }) => {
  if (variant === 'dot')
    return (
      <span
        aria-hidden
        className={clsx(
          'inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors duration-200 border-primary',
          className
        )}
      >
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full bg-primary transition-opacity duration-150',
            active ? 'opacity-100' : 'opacity-0'
          )}
        />
      </span>
    );

  const Icon = active ? OkFillIcon : CircleIcon;

  return <IconBase Icon={Icon} size={24} className={clsx(active ? 'text-primary' : 'text-grey-3', className)} />;
});
