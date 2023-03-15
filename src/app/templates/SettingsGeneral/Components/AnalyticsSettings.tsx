import React from 'react';

import { FormCheckbox } from 'app/atoms';
import { useAnalyticsSettings } from 'lib/analytics';
import { t, T } from 'lib/i18n';

import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';

const AnalyticsSettings: React.FC = () => {
  const { analyticsEnabled: enabled, setAnalyticsEnabled } = useAnalyticsSettings();

  return (
    <>
      <label className="mb-4 leading-tight flex flex-col" htmlFor="analyticsSettings">
        <span className="text-base font-semibold text-gray-700">
          <T id="analyticsSettings" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          <T id="analyticsSettingsDescription" />
        </span>
      </label>

      <FormCheckbox
        checked={enabled}
        onChange={setAnalyticsEnabled}
        name="analyticsEnabled"
        label={t(enabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.anonymousAnalyticsCheckBox}
        testIDProperties={{ enabled }}
      />
    </>
  );
};

export default AnalyticsSettings;
