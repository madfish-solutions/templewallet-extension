import React, { FC } from 'react';

import { FormCheckbox } from 'app/atoms';
import { t, T } from 'lib/i18n';
import { getIsLockUpEnabled, saveIsLockUpEnabled } from 'lib/lock-up';

const LockUpSettings: FC<{}> = () => {
  const isLockUpEnabled = getIsLockUpEnabled();

  const handleLockUpChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    saveIsLockUpEnabled(evt.target.checked);
  };

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
        checked={isLockUpEnabled}
        onChange={handleLockUpChange}
        name="isLockUpEnabled"
        label={t(isLockUpEnabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
      />
    </>
  );
};

export default LockUpSettings;
