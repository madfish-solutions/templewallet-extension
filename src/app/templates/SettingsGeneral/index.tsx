import React, { memo } from 'react';

import { NotificationsSettings } from 'lib/notifications/components';

import AnalyticsSettings from './components/AnalyticsSettings';
import FiatCurrencySelect from './components/FiatCurrencySelect';
import LocaleSelect from './components/LocaleSelect';
import LockUpSettings from './components/LockUpSettings';
import PopupSettings from './components/PopupSettings';

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
