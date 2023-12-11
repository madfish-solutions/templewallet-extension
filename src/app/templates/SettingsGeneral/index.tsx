import React, { FC } from 'react';

import AnalyticsSettings from 'app/templates/SettingsGeneral/Components/AnalyticsSettings';
import BlockExplorerSelect from 'app/templates/SettingsGeneral/Components/BlockExplorerSelect';
import FiatCurrencySelect from 'app/templates/SettingsGeneral/Components/FiatCurrencySelect';
import LocaleSelect from 'app/templates/SettingsGeneral/Components/LocaleSelect';
import LockUpSettings from 'app/templates/SettingsGeneral/Components/LockUpSettings';
import PopupSettings from 'app/templates/SettingsGeneral/Components/PopupSettings';
import { NotificationsSettings } from 'lib/notifications/components';

import { PartnersPromotionSettings } from './Components/partners-promotion-settings';

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

      <PartnersPromotionSettings />
    </div>
  );
};

export default GeneralSettings;
