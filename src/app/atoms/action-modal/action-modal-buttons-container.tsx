import React, { HTMLAttributes, memo } from 'react';

import clsx from 'clsx';

export const ActionModalButtonsContainer = memo<HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...restProps }) => (
    <div className={clsx('w-full px-3 pt-4 pb-3 flex gap-2.5', className)} {...restProps}>
      {children}
    </div>
  )
);
