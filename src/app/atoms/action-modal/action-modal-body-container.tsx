import React, { HTMLAttributes, memo } from 'react';

import clsx from 'clsx';

export const ActionModalBodyContainer = memo<HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...restProps }) => (
    <div className={clsx('w-full flex flex-col px-3 pt-2.5 max-w-modal', className)} {...restProps}>
      {children}
    </div>
  )
);
