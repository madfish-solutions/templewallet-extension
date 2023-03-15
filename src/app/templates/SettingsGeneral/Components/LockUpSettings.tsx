import React, { FC } from 'react';

import { FormCheckbox } from 'app/atoms';
import { t, T } from 'lib/i18n';
import { useIsLockUpEnabled } from 'lib/lock-up';

import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';

const LockUpSettings: FC<{}> = () => {
  const [enabled, saveIsLockUpEnabled] = useIsLockUpEnabled();

  return (
    <>
      <label className="mb-4 leading-tight flex flex-col" htmlFor="lockUpSettings">
        <span className="text-base font-semibold text-gray-700">
          <T id="lockUpSettings" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          <T id="lockUpSettingsDescription" />
        </span>
      </label>

      <FormCheckbox
        checked={enabled}
        onChange={saveIsLockUpEnabled}
        name="isLockUpEnabled"
        label={t(enabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.extensionLockUpCheckBox}
        testIDProperties={{ enabled }}
      />
    </>
  );
};

export default LockUpSettings;
