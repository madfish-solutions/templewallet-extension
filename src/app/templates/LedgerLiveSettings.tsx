import React from 'react';

import { TransportType } from '@temple-wallet/ledger-bridge';

import FormCheckbox from 'app/atoms/FormCheckbox';
import { T, t } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';
import { TempleSharedStorageKey, useLocalStorage } from 'lib/temple/front';
import { getDefaultLedgerTransport } from 'lib/temple/ledger-live';

const LedgerLiveSettings: React.FC<{}> = () => {
  const { data: enabledByDefault } = useRetryableSWR(['is-ledger-live-enabled-by-default'], getDefaultLedgerTransport);

  const [ledgerTransportType, setLedgerTransportType] = useLocalStorage<boolean>(
    TempleSharedStorageKey.UseLedgerLive,
    false
  );

  const handlePopupModeChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setLedgerTransportType(evt.target.checked);
  };

  const settingsDisplayed = enabledByDefault !== TransportType.U2F && process.env.TARGET_BROWSER !== 'firefox';

  const ledgerLabel = ledgerTransportType ? 'enabled' : 'disabled';

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
        checked={ledgerTransportType}
        onChange={handlePopupModeChange}
        name="ledgerLiveEnabled"
        label={t(ledgerLabel)}
        containerClassName="mb-4"
      />
    </>
  ) : null;
};

export default LedgerLiveSettings;
