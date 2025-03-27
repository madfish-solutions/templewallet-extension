import React, { FC } from 'react';

import clsx from 'clsx';

import { ChartListItem } from 'app/templates/chart-list-item';
import { T, TID } from 'lib/i18n';

interface InfoContainerProps extends PropsWithChildren {
  className?: string;
  onClick?: EmptyFn;
}

export const InfoContainer: FC<InfoContainerProps> = ({ className, onClick, children }) => (
  <div
    className={clsx('flex flex-col px-4 py-2 rounded-lg shadow-bottom border-0.5 border-transparent', className)}
    onClick={onClick}
  >
    {children}
  </div>
);

interface InfoRawProps extends Omit<InfoContainerProps, 'onClick'> {
  title: TID;
  bottomSeparator?: boolean;
}

export const InfoRaw: FC<InfoRawProps> = ({ title, bottomSeparator = false, className, children }) => (
  <ChartListItem title={<T id={title} />} bottomSeparator={bottomSeparator} className={clsx('py-3', className)}>
    {children}
  </ChartListItem>
);
