import React, { memo } from 'react';

import clsx from 'clsx';

import { Button, ButtonProps } from './Button';

export const SocialButton = memo<ButtonProps>(({ className, ...rest }) => (
  <Button
    className={clsx(
      className,
      'flex justify-center items-center rounded-lg border-2 h-10 gap-1',
      'border-secondary hover:border-secondary-hover text-secondary hover:text-secondary-hover'
    )}
    {...rest}
  />
));
