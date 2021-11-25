import React from 'react';

import FormCheckbox from 'app/atoms/FormCheckbox';
import { t, T } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';
import { TempleSharedStorageKey, useLocalStorage } from 'lib/temple/front';
import { isLedgerLiveEnabledByDefault } from 'lib/temple/ledger-live';

const LedgerLiveSettings: React.FC<{}> = () => {
  const { data: enabledByDefault } = useRetryableSWR(
    ['is-ledger-live-enabled-by-default'],
    isLedgerLiveEnabledByDefault
  );

  const settingsDisplayed = !enabledByDefault && process.env.TARGET_BROWSER !== 'firefox';

  const [ledgerLiveEnabled, setLedgerLiveEnabled] = useLocalStorage<boolean>(
    TempleSharedStorageKey.UseLedgerLive,
    false
  );

  const handlePopupModeChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setLedgerLiveEnabled(evt.target.checked);
  };

  return settingsDisplayed ? (
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
        checked={ledgerLiveEnabled}
        onChange={handlePopupModeChange}
        name="ledgerLiveEnabled"
        label={t(ledgerLiveEnabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
      />
    </>
  ) : null;
};

export default LedgerLiveSettings;
