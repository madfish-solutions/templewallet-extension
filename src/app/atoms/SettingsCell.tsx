import React, { FC, HTMLAttributes, ReactNode } from 'react';

import clsx from 'clsx';

interface ComponentBase {
  className?: string;
  children?: ReactNode;
}

interface SettingsCellPropsBase<P extends ComponentBase = ComponentBase> {
  isLast?: boolean;
  cellIcon?: ReactNode;
  cellName: ReactNode;
  cellNameClassName?: string;
  wrapCellName?: boolean;
  Component: 'div' | FC<P>;
}

interface DivSettingsCellProps extends HTMLAttributes<HTMLDivElement>, SettingsCellPropsBase {
  Component: 'div';
}

type FCSettingsCellProps<P extends ComponentBase> = P & SettingsCellPropsBase<P> & { Component: FC<P> };

type SettingsCellSingleProps<P extends ComponentBase> = P extends { Component: 'div' }
  ? DivSettingsCellProps
  : FCSettingsCellProps<P>;

export const SettingsCellSingle = <P extends ComponentBase>({
  className,
  cellIcon,
  cellName,
  cellNameClassName = 'text-left text-font-medium-bold flex-1',
  wrapCellName = true,
  isLast = true,
  children,
  Component,
  ...restProps
}: SettingsCellSingleProps<P>) => {
  return (
    <Component
      className={clsx('flex items-center p-3 gap-2', !isLast && 'border-b-0.5 border-lines', className)}
      {...restProps}
    >
      {cellIcon}

      {wrapCellName ? <span className={cellNameClassName}>{cellName}</span> : cellName}

      {children}
    </Component>
  );
};
