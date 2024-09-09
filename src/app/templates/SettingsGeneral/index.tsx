import React, { FC } from 'react';

import { NotificationsSettings } from 'lib/notifications/components';

import AnalyticsSettings from './Components/AnalyticsSettings';
import BlockExplorerSelect from './Components/BlockExplorerSelect';
import FiatCurrencySelect from './Components/FiatCurrencySelect';
import LocaleSelect from './Components/LocaleSelect';
import LockUpSettings from './Components/LockUpSettings';
import PopupSettings from './Components/PopupSettings';

const GeneralSettings: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <LocaleSelect />

      <FiatCurrencySelect />

      <BlockExplorerSelect />

      <PopupSettings />

      <LockUpSettings />

      <AnalyticsSettings />

      <NotificationsSettings />
    </div>
  );
};

export default GeneralSettings;
