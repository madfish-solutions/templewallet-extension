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
  Component: 'div' | FC<P>;
}

interface DivSettingsCellProps extends HTMLAttributes<HTMLDivElement>, SettingsCellPropsBase {
  Component: 'div';
}

type FCSettingsCellProps<P extends ComponentBase> = P & SettingsCellPropsBase<P> & { Component: FC<P> };

type SettingsCellProps<P extends ComponentBase> = P extends { Component: 'div' }
  ? DivSettingsCellProps
  : FCSettingsCellProps<P>;

export const SettingsCell = <P extends ComponentBase>({
  className,
  cellIcon,
  cellName,
  isLast = true,
  children,
  Component,
  ...restProps
}: SettingsCellProps<P>) => {
  return (
    <Component
      className={clsx('flex justify-between items-center p-3', !isLast && 'border-b-0.5 border-lines', className)}
      {...restProps}
    >
      <div className="flex items-center gap-2">
        {cellIcon}

        <span className="text-font-medium-bold">{cellName}</span>
      </div>

      {children}
    </Component>
  );
};
