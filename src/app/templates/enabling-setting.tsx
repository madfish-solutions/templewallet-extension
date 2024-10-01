import React, { ReactNode, memo } from 'react';

import { ToggleSwitch } from 'app/atoms';
import { SettingsCell } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { T, TID } from 'lib/i18n';

interface EnablingSettingProps {
  titleI18nKey: TID;
  enabled: boolean;
  description: ReactNode;
  onChange: (newValue: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  testID: string;
}

export const EnablingSetting = memo(
  ({ titleI18nKey, enabled, description, onChange, testID }: EnablingSettingProps) => (
    <SettingsCellGroup>
      <SettingsCell Component="div" isLast={false} cellName={<T id={titleI18nKey} />}>
        <ToggleSwitch checked={enabled} onChange={onChange} testID={testID} />
      </SettingsCell>
      <SettingsCell
        Component="div"
        cellName={description}
        cellNameClassName="text-grey-1 text-font-description font-normal"
      >
        {null}
      </SettingsCell>
    </SettingsCellGroup>
  )
);
