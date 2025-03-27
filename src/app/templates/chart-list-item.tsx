import React, { FC, memo, PropsWithChildren, ReactNode } from 'react';

import clsx from 'clsx';

export interface ChartListItemProps extends PropsWithChildren {
  className?: string;
  titleClassName?: string;
  title: ReactNode;
  bottomSeparator?: boolean;
}

export const ChartListItem: FC<ChartListItemProps> = ({
  className,
  titleClassName,
  title,
  bottomSeparator = true,
  children
}) => (
  <div
    className={clsx(
      'py-2 flex flex-row justify-between items-center',
      bottomSeparator && 'border-b-0.5 border-lines',
      className
    )}
  >
    <p className={clsx('p-1 text-font-description text-grey-1', titleClassName)}>{title}</p>
    {children}
  </div>
);

interface PlainChartListItemProps extends ChartListItemProps {
  children: string | number | nullish;
}

export const PlainChartListItem = memo<PlainChartListItemProps>(({ children, ...restProps }) => (
  <ChartListItem {...restProps}>
    <p className="p-1 text-font-description-bold">{children}</p>
  </ChartListItem>
));
