import React, { ReactNode, memo } from 'react';

import { ToggleSwitch } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';

interface EnablingSettingProps {
  title: ReactNode;
  enabled: boolean;
  description: ReactNode;
  onChange: (value: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  testID: string;
  children?: ReactNode;
}

export const EnablingSetting = memo(
  ({ title, enabled, description, onChange, testID, children }: EnablingSettingProps) => {
    const setting = (
      <SettingsCellGroup className={children ? 'border-none shadow-bottom' : undefined}>
        <SettingsCellSingle Component="div" isLast={false} cellName={title}>
          <ToggleSwitch checked={enabled} onChange={onChange} testID={testID} />
        </SettingsCellSingle>

        <SettingsCellSingle
          Component="div"
          cellName={description}
          cellNameClassName="text-grey-1 text-font-description font-normal"
        >
          {null}
        </SettingsCellSingle>
      </SettingsCellGroup>
    );

    return children ? (
      <div className="flex flex-col rounded-lg border-0.5 border-lines">
        {setting}
        {children}
      </div>
    ) : (
      setting
    );
  }
);
