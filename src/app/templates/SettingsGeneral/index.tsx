import React, { memo } from 'react';

import { FiatCurrencySelect } from './components/fiat-currency-select';
import { LocaleSelect } from './components/locale-select';
import { NotificationsSettings } from './components/notifications-settings';
import PopupSettings from './components/popup-settings';

const GeneralSettings = memo(() => (
  <div className="w-full flex flex-col gap-4">
    <LocaleSelect />

    <FiatCurrencySelect />

    <PopupSettings />

    <NotificationsSettings />
  </div>
));

export default GeneralSettings;
