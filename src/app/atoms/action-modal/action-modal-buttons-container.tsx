import React, { HTMLAttributes, memo } from 'react';

import clsx from 'clsx';

export const ActionModalButtonsContainer = memo<HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...restProps }) => (
    <div className={clsx('w-full px-3 py-4 flex gap-2.5 max-w-sm', className)} {...restProps}>
      {children}
    </div>
  )
);
