import React, { FC, HTMLAttributes, ReactNode } from 'react';

import clsx from 'clsx';

interface ComponentBase {
  className?: string;
  children?: ReactNode;
}

interface SettingsCellPropsBase<P extends ComponentBase = ComponentBase> {
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
  cellName: name,
  children,
  Component,
  ...restProps
}: SettingsCellProps<P>) => {
  return (
    <Component
      className={clsx(
        'flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines',
        className
      )}
      {...restProps}
    >
      <span className="text-font-medium-bold">{name}</span>

      {children}
    </Component>
  );
};
