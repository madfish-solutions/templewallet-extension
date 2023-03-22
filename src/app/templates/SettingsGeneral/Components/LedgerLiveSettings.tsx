import React from 'react';

import { FormCheckbox } from 'app/atoms';
import { t } from 'lib/i18n';
import { TempleSharedStorageKey } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';

import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';
import { GeneralSettingLabel } from './GeneralSettingLabel';

const LedgerLiveSettings: React.FC<{}> = () => {
  const [ledgerLiveEnabled, setLedgerLiveEnabled] = useLocalStorage<boolean>(
    TempleSharedStorageKey.UseLedgerLive,
    false
  );

  return (
    <>
      <GeneralSettingLabel titleI18nKey="ledgerLiveSettings" descriptionI18nKey="ledgerLiveSettingsDescription" />

      <FormCheckbox
        checked={ledgerLiveEnabled}
        onChange={setLedgerLiveEnabled}
        name="ledgerLiveEnabled"
        label={t(ledgerLiveEnabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.useLedgerLiveCheckBox}
      />
    </>
  );
};

export default LedgerLiveSettings;
