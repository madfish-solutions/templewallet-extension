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
  disabled?: boolean;
}

export const EnablingSetting = memo(
  ({ title, enabled, description, onChange, testID, disabled }: EnablingSettingProps) => (
    <SettingsCellGroup>
      <SettingsCellSingle Component="div" isLast={false} cellName={title}>
        <ToggleSwitch checked={enabled} onChange={onChange} testID={testID} disabled={disabled} />
      </SettingsCellSingle>

      <SettingsCellSingle
        Component="div"
        cellName={description}
        cellNameClassName="text-grey-1 text-font-description font-normal"
      >
        {null}
      </SettingsCellSingle>
    </SettingsCellGroup>
  )
);
