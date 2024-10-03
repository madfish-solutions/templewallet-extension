import React, { FC, HTMLAttributes, ReactElement, ReactNode } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';

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

type SettingsCellSingleProps<P extends ComponentBase> = P extends { Component: 'div' }
  ? DivSettingsCellProps
  : FCSettingsCellProps<P>;

export const SettingsCellSingle = <P extends ComponentBase>({
  className,
  cellName: name,
  children,
  Component,
  ...restProps
}: SettingsCellSingleProps<P>) => {
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

interface Props {
  title: ReactNode;
  first?: boolean;
  icon: ReactElement;
  onClick: EmptyFn;
}

export const SettingsCell: FC<Props> = ({ title, first, onClick, icon }) => {
  return (
    <Button
      className={clsx('flex items-center justify-between p-3 gap-x-2 border-lines', !first && 'border-t-0.5')}
      onClick={onClick}
    >
      <span className="text-font-medium-bold">{title}</span>

      {icon}
    </Button>
  );
};
