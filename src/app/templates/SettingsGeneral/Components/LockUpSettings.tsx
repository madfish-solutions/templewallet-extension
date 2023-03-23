import React, { FC } from 'react';

import { useIsLockUpEnabled } from 'lib/lock-up';

import { SettingsGeneralSelectors } from '../selectors';
import { EnablingSetting } from './EnablingSetting';

const LockUpSettings: FC<{}> = () => {
  const [isLockUpEnabled, saveIsLockUpEnabled] = useIsLockUpEnabled();

  return (
    <EnablingSetting
      titleI18nKey="lockUpSettings"
      descriptionI18nKey="lockUpSettingsDescription"
      enabled={isLockUpEnabled}
      onChange={saveIsLockUpEnabled}
      testID={SettingsGeneralSelectors.extensionLockUpCheckBox}
    />
  );
};

export default LockUpSettings;
