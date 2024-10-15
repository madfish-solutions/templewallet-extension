import React, { FC, HTMLAttributes, ReactElement, ReactNode } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';

interface ComponentBase {
  className?: string;
  children?: ReactNode;
}

interface SettingsCellPropsBase<P extends ComponentBase = ComponentBase> {
  isLast?: boolean;
  cellIcon?: ReactNode;
  cellName: ReactNode;
  cellNameClassName?: string;
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
  cellNameClassName = 'text-font-medium-bold',
  isLast = true,
  children,
  Component,
  ...restProps
}: SettingsCellSingleProps<P>) => {
  return (
    <Component
      className={clsx('flex justify-between items-center p-3', !isLast && 'border-b-0.5 border-lines', className)}
      {...restProps}
    >
      <div className="flex items-center gap-2">
        {cellIcon}

        <span className={cellNameClassName}>{cellName}</span>
      </div>

      {children}
    </Component>
  );
};

interface Props {
  title: ReactNode;
  first?: boolean;
  icon: ReactElement;
  onClick: EmptyFn;
}

// @ts-prune-ignore-next
export const SettingsCell: FC<Props> = ({ title, first, onClick, icon }) => (
  <Button
    className={clsx('flex items-center justify-between p-3 gap-x-2 border-lines', !first && 'border-t-0.5')}
    onClick={onClick}
  >
    <span className="text-font-medium-bold">{title}</span>

    {icon}
  </Button>
);
