import React, { FC, useCallback, useRef, useState } from 'react';

import FormCheckbox from 'app/atoms/FormCheckbox';
import { t, T } from 'lib/i18n/react';
import { isLockUpEnabled, setLockUp } from 'lib/ui/useLockUp';

const LockUpSettings: FC<{}> = () => {
  const lockUpEnabled = isLockUpEnabled();
  const changingRef = useRef(false);
  const [error, setError] = useState<any>(null);

  const handlePopupModeChange = useCallback(
    evt => {
      if (changingRef.current) return;
      changingRef.current = true;
      setError(null);

      setLockUp(evt.target.checked);
      changingRef.current = false;
      window.location.reload();
    },
    [setError]
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
        checked={lockUpEnabled}
        onChange={handlePopupModeChange}
        name="lockUpEnabled"
        label={t(lockUpEnabled ? 'enabled' : 'disabled')}
        errorCaption={error?.message}
        containerClassName="mb-4"
      />
    </>
  );
};

export default LockUpSettings;
