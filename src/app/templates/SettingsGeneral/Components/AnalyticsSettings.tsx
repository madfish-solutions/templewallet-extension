import React from 'react';

import { useDispatch } from 'react-redux';

import { setIsAnalyticsEnabledAction } from 'app/store/settings/actions';
import { useAnalyticsEnabledSelector } from 'app/store/settings/selectors';

import { SettingsGeneralSelectors } from '../selectors';

import { EnablingSetting } from './EnablingSetting';

const AnalyticsSettings: React.FC = () => {
  const dispatch = useDispatch();
  const analyticsEnabled = useAnalyticsEnabledSelector();

  const setAnalyticsEnabled = () => dispatch(setIsAnalyticsEnabledAction(!analyticsEnabled));

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
