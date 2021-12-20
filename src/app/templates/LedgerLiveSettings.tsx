import React from 'react';

import FormCheckbox from 'app/atoms/FormCheckbox';
import { T, t } from 'lib/i18n/react';
import { TempleSharedStorageKey, useLocalStorage } from 'lib/temple/front';

const LedgerLiveSettings: React.FC<{}> = () => {
  const [ledgerTransportType, setLedgerTransportType] = useLocalStorage<boolean>(
    TempleSharedStorageKey.UseLedgerLive,
    false
  );

  const handlePopupModeChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setLedgerTransportType(evt.target.checked);
  };

  return (
    <>
      <label className="mb-4 leading-tight flex flex-col" htmlFor="ledgerLiveSettings">
        <span className="text-base font-semibold text-gray-700">
          <T id="ledgerLiveSettings" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          <T id="ledgerLiveSettingsDescription" />
        </span>
      </label>

      <FormCheckbox
        checked={ledgerTransportType}
        onChange={handlePopupModeChange}
        name="ledgerLiveEnabled"
        label={t(ledgerTransportType ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
      />
    </>
  );
};

export default LedgerLiveSettings;
