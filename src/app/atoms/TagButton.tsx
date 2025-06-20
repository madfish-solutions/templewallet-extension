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
      'flex-shrink-0 p-1 rounded',
      'text-font-small-bold text-white uppercase',
      'bg-secondary hover:bg-secondary-hover',
      className
    )}
    testID={testID}
    data-test-id-properties={testIDProperties ? JSON.stringify(testIDProperties) : undefined}
    {...rest}
  >
    {children}
  </Button>
);
