import React, { FC, useCallback } from 'react';

import { FormCheckbox } from 'app/atoms';
import { t, T } from 'lib/i18n';
import { useIsLockUpEnabled } from 'lib/ui/useLockUp';

const LockUpSettings: FC<{}> = () => {
  const [isLockUpEnabled, setIsLockUpEnabled] = useIsLockUpEnabled();

  const handleLockUpChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setIsLockUpEnabled(evt.target.checked);
    },
    [setIsLockUpEnabled]
  );

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
