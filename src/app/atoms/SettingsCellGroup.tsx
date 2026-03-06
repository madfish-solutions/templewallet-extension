import React, { FC, HTMLAttributes } from 'react';

import clsx from 'clsx';

export const SettingsCellGroup: FC<PropsWithChildren<HTMLAttributes<HTMLDivElement>>> = ({
  className,
  children,
  ...restProps
}) => (
  <div className={clsx('flex flex-col rounded-lg bg-white border-0.5 border-lines', className)} {...restProps}>
    {children}
  </div>
);
