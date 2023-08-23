import React, { FC, ReactNode } from 'react';

import clsx from 'clsx';

interface Props {
  className?: string;
  title: string | ReactNode;
  children: ReactNode | ReactNode[];
}

export const ActivityDetailsRow: FC<Props> = ({ className, title, children }) => (
  <div className={clsx('w-full py-3 flex', className)}>
    <span className="flex-1 text-gray-500 text-xs leading-5">{title}</span>
    {children}
  </div>
);
