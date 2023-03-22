import React from 'react';

import { FormCheckbox } from 'app/atoms';
import { useAnalyticsSettings } from 'lib/analytics';
import { t } from 'lib/i18n';

import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';
import { GeneralSettingLabel } from './GeneralSettingLabel';

const AnalyticsSettings: React.FC = () => {
  const { analyticsEnabled, setAnalyticsEnabled } = useAnalyticsSettings();

  return (
    <>
      <GeneralSettingLabel titleI18nKey="analyticsSettings" descriptionI18nKey="analyticsSettingsDescription" />

      <FormCheckbox
        checked={analyticsEnabled}
        onChange={setAnalyticsEnabled}
        name="analyticsEnabled"
        label={t(analyticsEnabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.anonymousAnalyticsCheckBox}
      />
    </>
  );
};

export default AnalyticsSettings;
