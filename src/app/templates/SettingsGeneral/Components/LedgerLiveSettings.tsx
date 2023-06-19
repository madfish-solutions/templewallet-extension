import React from 'react';

import { TempleSharedStorageKey } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';

import { SettingsGeneralSelectors } from '../selectors';
import { EnablingSetting } from './EnablingSetting';

const LedgerLiveSettings: React.FC<{}> = () => {
  const [ledgerLiveEnabled, setLedgerLiveEnabled] = useLocalStorage<boolean>(
    TempleSharedStorageKey.UseLedgerLive,
    false
  );

  return (
    <EnablingSetting
      titleI18nKey="ledgerLiveSettings"
      descriptionI18nKey="ledgerLiveSettingsDescription"
      enabled={ledgerLiveEnabled}
      onChange={setLedgerLiveEnabled}
      testID={SettingsGeneralSelectors.useLedgerLiveCheckBox}
    />
  );
};

export default LedgerLiveSettings;
