import React, { memo } from 'react';

import { NotificationsSettings } from 'lib/notifications/components';

import AnalyticsSettings from './Components/AnalyticsSettings';
import FiatCurrencySelect from './Components/FiatCurrencySelect';
import LocaleSelect from './Components/LocaleSelect';
import LockUpSettings from './Components/LockUpSettings';
import PopupSettings from './Components/PopupSettings';

const GeneralSettings = memo(() => (
  <div className="w-full max-w-sm mx-auto my-8">
    <LocaleSelect />

    <FiatCurrencySelect />

    <PopupSettings />

    <LockUpSettings />

    <AnalyticsSettings />

    <NotificationsSettings />
  </div>
));

export default GeneralSettings;
