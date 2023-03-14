import React from 'react';

import { FormCheckbox } from 'app/atoms';
import { T, t } from 'lib/i18n';
import { TempleSharedStorageKey } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';

import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';

const LedgerLiveSettings: React.FC<{}> = () => {
  const [ledgerLiveEnabled, setLedgerLiveEnabled] = useLocalStorage<boolean>(
    TempleSharedStorageKey.UseLedgerLive,
    false
  );

  const ledgerLabel = ledgerLiveEnabled ? 'enabled' : 'disabled';

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
        checked={ledgerLiveEnabled}
        onChange={setLedgerLiveEnabled}
        name="ledgerLiveEnabled"
        label={t(ledgerLabel)}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.useLedgerLiveCheckBox}
      />
    </>
  );
};

export default LedgerLiveSettings;
