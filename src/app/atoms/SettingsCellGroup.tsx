import React, { Children, HTMLAttributes, memo } from 'react';

import clsx from 'clsx';

export const SettingsCellGroup = memo<PropsWithChildren<HTMLAttributes<HTMLDivElement>>>(
  ({ className, children, ...restProps }) => (
    <div
      className={clsx(
        'flex flex-col rounded-lg shadow-bottom bg-white',
        Children.count(children) === 1 && 'border-0.5 border-transparent hover:border-lines',
        className
      )}
      {...restProps}
    >
      {children}
    </div>
  )
);
