import React, { ComponentType, useCallback } from 'react';

import { Button, IconBase } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { setTestID } from 'lib/analytics';

export interface CellPartProps<T> {
  option: T;
}

export interface SelectModalOptionProps<T> {
  option: T;
  className?: string;
  isSelected: boolean;
  CellIcon: ComponentType<CellPartProps<T>>;
  CellName: ComponentType<CellPartProps<T>>;
  onSelect: SyncFn<T>;
  testID: string;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const SelectModalOption = <T extends unknown>({
  option,
  className,
  isSelected,
  CellIcon,
  CellName,
  onSelect,
  testID
}: SelectModalOptionProps<T>) => {
  const handleClick = useCallback(() => onSelect(option), [onSelect, option]);

  return (
    <SettingsCellGroup className={className}>
      <SettingsCellSingle
        Component={Button}
        cellIcon={<CellIcon option={option} />}
        cellName={<CellName option={option} />}
        onClick={handleClick}
        {...setTestID(testID)}
      >
        {isSelected && <IconBase size={24} className="text-primary" Icon={OkFillIcon} />}
      </SettingsCellSingle>
    </SettingsCellGroup>
  );
};
