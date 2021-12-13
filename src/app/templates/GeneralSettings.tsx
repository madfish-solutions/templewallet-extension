import React, { FC } from 'react';

import AnalyticsSettings from 'app/templates/AnalyticsSettings';
import BlockExplorerSelect from 'app/templates/BlockExplorerSelect';
import LedgerLiveSettings from 'app/templates/LedgerLiveSettings';
import LocaleSelect from 'app/templates/LocaleSelect';
import LockUpSettings from 'app/templates/LockUpSettings';
import PopupSettings from 'app/templates/PopupSettings';

const GeneralSettings: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <LocaleSelect className="mb-8" />

      <BlockExplorerSelect className="mb-8" />

      <PopupSettings />

      <LockUpSettings />

      <AnalyticsSettings />

      <LedgerLiveSettings />
    </div>
  );
};

export default GeneralSettings;
