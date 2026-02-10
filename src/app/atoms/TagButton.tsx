import React, { FC, ButtonHTMLAttributes } from 'react';

import clsx from 'clsx';

import { Button } from './Button';

interface TagButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  testID?: string;
  testIDProperties?: Record<string, unknown>;
}

export const TagButton: FC<TagButtonProps> = ({ children, className, testID, testIDProperties, ...rest }) => (
  <Button
    className={clsx(
      'shrink-0 p-1 rounded-sm',
      'text-font-small-bold text-white uppercase',
      'bg-secondary hover:bg-secondary-hover',
      className
    )}
    testID={testID}
    testIDProperties={testIDProperties}
    {...rest}
  >
    {children}
  </Button>
);
