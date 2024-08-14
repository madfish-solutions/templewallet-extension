import React, { HTMLAttributes, memo } from 'react';

import clsx from 'clsx';

export const ActionModalBodyContainer = memo<HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...restProps }) => (
    <div className={clsx('w-full flex flex-col px-3 pt-3 max-w-sm', className)} {...restProps}>
      {children}
    </div>
  )
);
