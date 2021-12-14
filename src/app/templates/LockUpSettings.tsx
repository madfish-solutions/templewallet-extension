import React, { FC, useCallback } from 'react';

import FormCheckbox from 'app/atoms/FormCheckbox';
import { t, T } from 'lib/i18n/react';
import { isLockUpEnabled, setLockUp } from 'lib/ui/useLockUp';

const LockUpSettings: FC<{}> = () => {
  const lockUpEnabled = isLockUpEnabled();

  const handleLockUpChange = useCallback(evt => {
    setLockUp(evt.target.checked);
  }, []);

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
        checked={lockUpEnabled}
        onChange={handleLockUpChange}
        name="lockUpEnabled"
        label={t(lockUpEnabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
      />
    </>
  );
};

export default LockUpSettings;
