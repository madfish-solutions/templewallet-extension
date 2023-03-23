import React from 'react';

import { useAnalyticsSettings } from 'lib/analytics';

import { SettingsGeneralSelectors } from '../selectors';
import { EnablingSetting } from './EnablingSetting';

const AnalyticsSettings: React.FC = () => {
  const { analyticsEnabled, setAnalyticsEnabled } = useAnalyticsSettings();

  return (
    <EnablingSetting
      titleI18nKey="analyticsSettings"
      descriptionI18nKey="analyticsSettingsDescription"
      enabled={analyticsEnabled}
      onChange={setAnalyticsEnabled}
      testID={SettingsGeneralSelectors.anonymousAnalyticsCheckBox}
    />
  );
};

export default AnalyticsSettings;
