import React, { FC } from 'react';

import { FormCheckbox } from 'app/atoms';
import { t } from 'lib/i18n';
import { useIsLockUpEnabled } from 'lib/lock-up';

import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';
import { GeneralSettingLabel } from './GeneralSettingLabel';

const LockUpSettings: FC<{}> = () => {
  const [isLockUpEnabled, saveIsLockUpEnabled] = useIsLockUpEnabled();

  return (
    <>
      <GeneralSettingLabel titleI18nKey="lockUpSettings" descriptionI18nKey="lockUpSettingsDescription" />

      <FormCheckbox
        checked={isLockUpEnabled}
        onChange={saveIsLockUpEnabled}
        label={t(isLockUpEnabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.extensionLockUpCheckBox}
      />
    </>
  );
};

export default LockUpSettings;
